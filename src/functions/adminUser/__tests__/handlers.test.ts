import {
  handleCheckAdminUserExists,
  handleCheckAdminUserAccountIsClaimed,
  handleSetAdminUserPassword,
  handleSendAdminUserVerificationCode,
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
  setPassword,
  putVerificationCode,
  fetchVerificationCode,
  deleteVerificationCode,
} from "../model";
import { Codes } from "../Error";
import { mocked } from "jest-mock";
import { APIGatewayProxyResult, Context } from "aws-lambda";
import { createAdminUser, createVerificationCode } from "./fixtures";
import { KMSClient, EncryptCommand } from "@aws-sdk/client-kms";
import { mockClient } from "aws-sdk-client-mock";
import { stringToUint8Array } from "@libs/kms";
import crypto from "crypto";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";

const mockedKMSClient = mockClient(KMSClient as any);
const mockedSESCLient = mockClient(SESClient as any);

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
        new Error(Codes.NON_EXISTENT_ADMIN_USER)
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

    it(`returns ${Codes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleCheckAdminUserAccountIsClaimed(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).message).toEqual(Codes.NON_EXISTENT_ADMIN_USER);
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

    it(`returns ${Codes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleSetAdminUserPassword(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).message).toEqual(Codes.NON_EXISTENT_ADMIN_USER);
    });
  });

  describe("when the user exists", () => {
    describe("when the passwords match", () => {
      describe("when the password is valid", () => {
        const password = faker.random.alphaNumeric(5) + "Aa1";

        const encryptedPassword = faker.datatype.string(20);
        const encryptedPasswordPlaintext =
          stringToUint8Array(encryptedPassword);
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
            await handleSetAdminUserPassword(
              APIGatewayEvent,
              context,
              jest.fn()
            );

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

          it(`returns ${Codes.ENCRYPTION_FAILED} error message`, async () => {
            const { body } = await handleSetAdminUserPassword(
              APIGatewayEvent,
              context,
              jest.fn()
            );

            expect(JSON.parse(body).message).toEqual(Codes.ENCRYPTION_FAILED);
          });
        });
      });

      describe("when the password is invalid", () => {
        beforeEach(() => {
          mocked(userDocumentExists).mockResolvedValueOnce(true);
        });

        describe.each([
          ["is too short", faker.random.alphaNumeric(4) + "Aa1"],
          ["has no uppercase letters", faker.random.alphaNumeric(6) + "a1"],
          [
            "has no lowercase letters",
            faker.random.alphaNumeric(6, { casing: "upper" }) + "A1",
          ],
          ["has no numbers", faker.random.alpha(6)],
        ])(`when the password %s`, (_, password) => {
          const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
            typeof adminUserSetPasswordInput
          >({
            body: {
              email,
              newPassword: password,
              confirmNewPassword: password,
            },
          });

          it("returns statusCode 400", async () => {
            const { statusCode } = await handleSetAdminUserPassword(
              APIGatewayEvent,
              context,
              jest.fn()
            );

            expect(statusCode).toEqual(400);
          });

          it(`returns ${Codes.INVALID_PASSWORD} error message`, async () => {
            const { body } = await handleSetAdminUserPassword(
              APIGatewayEvent,
              context,
              jest.fn()
            );

            expect(JSON.parse(body).message).toEqual(Codes.INVALID_PASSWORD);
          });
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

    it(`returns ${Codes.PASSWORD_MISMATCH} error message`, async () => {
      const { body } = await handleSetAdminUserPassword(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).message).toEqual(Codes.PASSWORD_MISMATCH);
    });
  });
});

describe("handleSendAdminUserVerificationCode", () => {
  const email = faker.internet.email();

  const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
    typeof adminUserEmailInput
  >({
    body: {
      email,
    },
  });

  describe("when the user does not exist", () => {
    beforeEach(() => {
      mocked(fetchUserByEmail).mockRejectedValueOnce(
        new Error(Codes.NON_EXISTENT_ADMIN_USER)
      );
    });

    it("returns statusCode 404", async () => {
      const { statusCode } = await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(statusCode).toEqual(404);
    });

    it(`returns ${Codes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(JSON.parse(body).message).toEqual(Codes.NON_EXISTENT_ADMIN_USER);
    });
  });

  describe("when the user exists", () => {
    const verificationCode = faker.random.alphaNumeric(6).toUpperCase();
    const codeHash = faker.datatype.string(20);
    const codeSalt = faker.datatype.string(10);
    const codeHashPlaintext = stringToUint8Array(codeHash);
    const userId = faker.datatype.uuid();

    const adminUser = createAdminUser({
      email,
      userId,
    });

    beforeEach(() => {
      mocked(fetchUserByEmail).mockResolvedValue(adminUser);

      mockedKMSClient.on(EncryptCommand as any).resolves({
        CiphertextBlob: codeHashPlaintext,
      } as any);

      mocked(crypto.randomBytes)
        .mockReturnValueOnce({
          toString: () => verificationCode,
        } as any)
        .mockReturnValueOnce({
          toString: () => codeSalt,
        } as any);
    });

    it("deletes any existing codes", async () => {
      await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(mocked(deleteVerificationCode)).toHaveBeenCalledWith(userId);
    });

    it("returns statusCode 200", async () => {
      const { statusCode } = await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(statusCode).toEqual(200);
    });

    it("inserts the verification code into the table", async () => {
      await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(mocked(putVerificationCode)).toHaveBeenCalledWith({
        userId,
        codeHash,
        codeSalt,
      });
    });

    it("sends the verification code to the user's email", async () => {
      await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      mockedSESCLient.calls()[0].calledWithExactly(
        new SendEmailCommand({
          Destination: {
            ToAddresses: [email],
          },
          Message: {
            Subject: {
              Data: "Spice Spice Baby Verification Code",
            },
            Body: {
              Text: {
                Data: `Your verification code is: ${verificationCode}`,
              },
            },
          },
          Source: "spicespicebaby01@gmail.com",
        })
      );
    });
  });
});
