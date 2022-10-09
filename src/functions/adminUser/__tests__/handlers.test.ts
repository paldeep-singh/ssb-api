import {
  handleCheckAdminUserExists,
  handleCheckAdminUserAccountIsClaimed,
  handleSetAdminUserPassword,
  handleSendAdminUserVerificationCode,
  handleVerifyAdminUserEmail,
} from "../handlers";
import { faker } from "@faker-js/faker";
import {
  createParsedAPIGatewayProxyEvent,
  createAPIGatewayProxyEventContext,
} from "@libs/fixtures";
import {
  adminUserEmailInput,
  adminUserSetPasswordInput,
  adminUserVerifyEmailInput,
} from "../schema";
import {
  putVerificationCode,
  fetchVerificationCode,
  deleteVerificationCode,
} from "../models/verificationCodes";
import { ErrorCodes } from "../misc";
import { mocked } from "jest-mock";
import { APIGatewayProxyResult } from "aws-lambda";
import { createAdminUser, createVerificationCode } from "./fixtures";
import { mockClient } from "aws-sdk-client-mock";
import { stringToUint8Array } from "@libs/kms";
import { SendEmailCommand, SESClient } from "@aws-sdk/client-ses";
import dayjs from "dayjs";
import {
  userDocumentExists,
  fetchUserByEmail,
  updatePassword,
} from "../models/adminUsers";
import bcrypt from "bcryptjs";
import { createNewSession } from "../models/sessions";

const mockedSESCLient = mockClient(SESClient as any);

jest.mock("../models/verificationCodes");
jest.mock("../models/adminUsers");
jest.mock("../models/sessions");
jest.mock("bcryptjs");
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
      }),
    ],
    [
      "not set",
      false,
      createAdminUser({
        passwordHash: "",
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
      describe("when the password is valid", () => {
        const password = faker.random.alphaNumeric(5) + "Aa1";

        const encryptedPassword = faker.datatype.string(20);

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
          mocked(userDocumentExists).mockResolvedValueOnce(true);

          mocked(bcrypt.hash).mockResolvedValueOnce(encryptedPassword as never);

          mocked(updatePassword).mockResolvedValueOnce();
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

          expect(updatePassword).toHaveBeenCalledWith({
            email,
            newPasswordHash: encryptedPassword,
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

          it(`returns ${ErrorCodes.INVALID_PASSWORD} error message`, async () => {
            const { body } = await handleSetAdminUserPassword(
              APIGatewayEvent,
              context,
              jest.fn()
            );

            expect(JSON.parse(body).message).toEqual(
              ErrorCodes.INVALID_PASSWORD
            );
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
        new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
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

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleSendAdminUserVerificationCode(
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
    const verificationCode = faker.random.alphaNumeric(6).toUpperCase();
    const codeHash = faker.datatype.string(20);
    const userId = faker.datatype.uuid();

    const adminUser = createAdminUser({
      email,
      userId,
    });

    beforeEach(() => {
      mocked(fetchUserByEmail).mockResolvedValue(adminUser);

      mocked(bcrypt.hash).mockResolvedValueOnce(codeHash as never);
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

describe("handleVerifyAdminUserEmail", () => {
  const email = faker.internet.email();
  const verificationCode = faker.random.alphaNumeric(6).toUpperCase();

  const APIGatewayEvent = createParsedAPIGatewayProxyEvent<
    typeof adminUserVerifyEmailInput
  >({
    body: {
      email,
      verificationCode,
    },
  });

  describe("when the user does not exist", () => {
    beforeEach(() => {
      mocked(fetchUserByEmail).mockRejectedValueOnce(
        new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
      );
    });

    it("returns statusCode 404", async () => {
      const { statusCode } = await handleVerifyAdminUserEmail(
        APIGatewayEvent,
        context,
        jest.fn()
      );

      expect(statusCode).toEqual(404);
    });

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleVerifyAdminUserEmail(
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
    const userId = faker.datatype.uuid();

    const adminUser = createAdminUser({
      email,
      userId,
    });

    beforeEach(() => {
      mocked(fetchUserByEmail).mockResolvedValue(adminUser);
    });

    describe("when no verification code exists for the user", () => {
      beforeEach(() => {
        mocked(fetchVerificationCode).mockRejectedValueOnce(
          new Error(ErrorCodes.NO_ACTIVE_VERIFICATION_CODE)
        );
      });

      it("returns statusCode 404", async () => {
        const { statusCode } = await handleVerifyAdminUserEmail(
          APIGatewayEvent,
          context,
          jest.fn()
        );

        expect(statusCode).toEqual(404);
      });

      it(`returns ${ErrorCodes.NO_ACTIVE_VERIFICATION_CODE} error message`, async () => {
        const { body } = await handleVerifyAdminUserEmail(
          APIGatewayEvent,
          context,
          jest.fn()
        );

        expect(JSON.parse(body).message).toEqual(
          ErrorCodes.NO_ACTIVE_VERIFICATION_CODE
        );
      });
    });

    describe("when a verification code exists for the user", () => {
      const expiredCode = createVerificationCode({
        userId,
        ttl: new Date().toISOString(),
      });
      describe("when the verification code is expired", () => {
        beforeEach(() => {
          mocked(fetchVerificationCode).mockResolvedValueOnce(expiredCode);
        });

        it("returns statusCode 400", async () => {
          const { statusCode } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(statusCode).toEqual(400);
        });

        it(`returns ${ErrorCodes.VERIFICATION_CODE_EXPIRED} error message`, async () => {
          const { body } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(JSON.parse(body).message).toEqual(
            ErrorCodes.VERIFICATION_CODE_EXPIRED
          );
        });
      });
    });

    describe("when the verification code has not expired", () => {
      const codeHash = faker.datatype.string(20);
      const storedCode = createVerificationCode({
        userId,
        ttl: dayjs().add(5, "minute").toISOString(),
        codeHash,
      });

      beforeEach(() => {
        mocked(fetchVerificationCode).mockResolvedValueOnce(storedCode);
      });

      describe("if the verification code does not match", () => {
        beforeEach(() => {
          mocked(bcrypt.compare).mockResolvedValueOnce(false as never);
        });

        it("returns statusCode 400", async () => {
          const { statusCode } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(statusCode).toEqual(400);
        });

        it(`returns ${ErrorCodes.INVALID_VERIFICATION_CODE} error message`, async () => {
          const { body } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(JSON.parse(body).message).toEqual(
            ErrorCodes.INVALID_VERIFICATION_CODE
          );
        });

        it("does not delete the verification code", async () => {
          await handleVerifyAdminUserEmail(APIGatewayEvent, context, jest.fn());

          expect(mocked(deleteVerificationCode)).not.toHaveBeenCalled();
        });
      });

      describe('if the verification code matches"', () => {
        const sessionId = faker.datatype.uuid();

        beforeEach(() => {
          mocked(bcrypt.compare).mockResolvedValueOnce(true as never);
          mocked(createNewSession).mockResolvedValueOnce(sessionId);
        });

        it("returns statusCode 200", async () => {
          const { statusCode } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(statusCode).toEqual(200);
        });

        it("returns the user id", async () => {
          const { body } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(JSON.parse(body).userId).toEqual(adminUser.userId);
        });

        it("returns a session id", async () => {
          const { body } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          );

          expect(JSON.parse(body).sessionId).toEqual(sessionId);
        });

        it("deletes the verification code", async () => {
          await handleVerifyAdminUserEmail(APIGatewayEvent, context, jest.fn());

          expect(mocked(deleteVerificationCode)).toHaveBeenCalledWith(userId);
        });
      });
    });
  });
});
