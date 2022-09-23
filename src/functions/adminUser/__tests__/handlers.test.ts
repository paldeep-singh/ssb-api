import {
  handleCheckAdminUserExists,
  handleCheckAdminUserAccountIsClaimed,
  handleSetAdminUserPassword,
} from "../handlers";
import { faker } from "@faker-js/faker";
import {
  createParsedAPIGatewayProxyEvent,
  createAPIGatewayProxyEventContext,
} from "@libs/fixtures";
import { adminUserEmailInput, adminUserSetPasswordInput } from "../schema";
import {
  userDocumentExists,
  fetchUserByEmail,
  ErrorCodes,
  setPassword,
} from "../model";
import { mocked } from "jest-mock";
import { APIGatewayProxyResult } from "aws-lambda";
import { createAdminUser } from "./fixtures";
import { KMSClient, EncryptCommand } from "@aws-sdk/client-kms";
import { mockClient } from "aws-sdk-client-mock";
import { stringToUint8Array } from "@libs/kms";
import crypto from "crypto";
const mockedKMSClient = mockClient(KMSClient as any);

jest.mock("../model");
jest.mock("crypto");
jest.mock("@middy/core", () => {
  return (handler: any) => {
    return {
      use: jest.fn().mockReturnValue(handler), // ...use(ssm()) will return handler function
    };
  };
});

beforeEach(() => {
  jest.clearAllMocks();
});

const email = faker.internet.email();
const context = createAPIGatewayProxyEventContext();

describe("handleAdminUserExists", () => {
  const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
    typeof adminUserEmailInput
  >({
    body: {
      email,
    },
  });
  describe.each([
    ["exists", 200, true],
    ["does not exist", 404, false],
  ])("when the user %s", (_, expectedStatusCode, expectedAdminUserExists) => {
    beforeEach(() => {
      mocked(userDocumentExists).mockResolvedValueOnce(expectedAdminUserExists);
    });

    it(`returns statusCode ${expectedStatusCode}`, async () => {
      const { statusCode }: APIGatewayProxyResult =
        await handleCheckAdminUserExists(APIGatewayEvent, context, jest.fn());

      expect(statusCode).toEqual(expectedStatusCode);
    });

    it(`returns adminUserExists: ${expectedAdminUserExists}`, async () => {
      const { body } = await handleCheckAdminUserExists(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).adminUserExists).toEqual(expectedAdminUserExists);
    });
  });
});

describe("handleCheckAdminUserAccountIsClaimed", () => {
  const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
    typeof adminUserEmailInput
  >({
    body: {
      email,
    },
  });
  describe.each([
    [
      "set",
      true,
      createAdminUser({
        passwordHash: faker.datatype.string(20),
        passwordSalt: faker.datatype.string(10),
      }),
    ],
    [
      "not set",
      false,
      createAdminUser({
        passwordHash: "",
        passwordSalt: "",
      }),
    ],
  ])(
    "when the user's password is %s",
    (_, expectedAccountClaimed, adminUser) => {
      beforeEach(() => {
        mocked(fetchUserByEmail).mockResolvedValueOnce(adminUser);
      });

      it(`returns statusCode 200`, async () => {
        const { statusCode } = await handleCheckAdminUserAccountIsClaimed(
          APIGatewayEvent,
          context,
          jest.fn()
        );

        expect(statusCode).toEqual(200);
      });

      it(`"returns accountIsClaimed ${expectedAccountClaimed}"`, async () => {
        const { body } = await handleCheckAdminUserAccountIsClaimed(
          APIGatewayEvent,
          context,
          jest.fn()
        );

        expect(JSON.parse(body).accountClaimed).toEqual(expectedAccountClaimed);
      });
    }
  );

  describe("when the user does not exist", () => {
    beforeEach(() => {
      mocked(fetchUserByEmail).mockRejectedValueOnce(
        new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
      );
    });

    it("returns statusCode 404", async () => {
      const { statusCode } = await handleCheckAdminUserAccountIsClaimed(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(statusCode).toEqual(404);
    });

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleCheckAdminUserAccountIsClaimed(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).message).toEqual(
        ErrorCodes.NON_EXISTENT_ADMIN_USER
      );
    });
  });
});

describe("handleSetAdminUserPassword", () => {
  describe("when the user does not exist", () => {
    const password = faker.internet.password();

    const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
      typeof adminUserSetPasswordInput
    >({
      body: {
        email,
        newPassword: password,
        confirmNewPassword: password,
      },
    });
    beforeEach(() => {
      mocked(userDocumentExists).mockResolvedValueOnce(false);
    });

    it("returns statusCode 404", async () => {
      const { statusCode } = await handleSetAdminUserPassword(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(statusCode).toEqual(404);
    });

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleSetAdminUserPassword(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).message).toEqual(
        ErrorCodes.NON_EXISTENT_ADMIN_USER
      );
    });
  });

  describe("when the user exists", () => {
    describe("when the passwords match", () => {
      const password = faker.internet.password();
      const encryptedPassword = faker.datatype.string(20);
      const encryptedPasswordPlaintext = stringToUint8Array(encryptedPassword);
      const passwordSalt = faker.datatype.string(10);

      const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
        typeof adminUserSetPasswordInput
      >({
        body: {
          email,
          newPassword: password,
          confirmNewPassword: password,
        },
      });

      describe("when encryption is successful", () => {
        beforeEach(() => {
          mocked(userDocumentExists).mockResolvedValueOnce(true);

          mockedKMSClient.on(EncryptCommand as any).resolves({
            CiphertextBlob: encryptedPasswordPlaintext,
          } as any);

          mocked(crypto.randomBytes).mockReturnValueOnce({
            toString: () => passwordSalt,
          } as any);

          mocked(setPassword).mockResolvedValueOnce();
        });

        it("returns statusCode 200", async () => {
          const { statusCode } = await handleSetAdminUserPassword(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(statusCode).toEqual(200);
        });

        it("calls setPassword with the correct arguments", async () => {
          await handleSetAdminUserPassword(APIGatewayEvent, context, jest.fn());

          expect(setPassword).toHaveBeenCalledWith({
            email,
            newPasswordHash: encryptedPassword,
            newPasswordSalt: passwordSalt,
          });
        });

        it(`returns passwordSet true`, async () => {
          const { body } = await handleSetAdminUserPassword(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(JSON.parse(body).passwordSet).toEqual(true);
        });
      });

      describe("when encryption is unsuccessful", () => {
        beforeEach(() => {
          mocked(userDocumentExists).mockResolvedValueOnce(true);

          mockedKMSClient.on(EncryptCommand as any).resolves({
            CiphertextBlob: undefined,
          } as any);

          mocked(crypto.randomBytes).mockReturnValueOnce({
            toString: () => passwordSalt,
          } as any);
        });

        it("returns statusCode 502", async () => {
          const { statusCode } = await handleSetAdminUserPassword(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(statusCode).toEqual(502);
        });

        it(`returns ${ErrorCodes.ENCRYPTION_FAILED} error message`, async () => {
          const { body } = await handleSetAdminUserPassword(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(JSON.parse(body).message).toEqual(
            ErrorCodes.ENCRYPTION_FAILED
          );
        });
      });
    });
  });

  describe("when the passwords do not match", () => {
    const password = faker.internet.password();
    const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
      typeof adminUserSetPasswordInput
    >({
      body: {
        email,
        newPassword: password,
        confirmNewPassword: faker.internet.password(),
      },
    });
    beforeEach(() => {
      mocked(userDocumentExists).mockResolvedValueOnce(true);
    });

    it("returns statusCode 400", async () => {
      const { statusCode } = await handleSetAdminUserPassword(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(statusCode).toEqual(400);
    });

    it(`returns ${ErrorCodes.PASSWORD_MISMATCH} error message`, async () => {
      const { body } = await handleSetAdminUserPassword(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).message).toEqual(ErrorCodes.PASSWORD_MISMATCH);
    });
  });
});
