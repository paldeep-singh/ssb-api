import { faker } from "@faker-js/faker";
import {
  createAdminUser,
  deleteTestAdminUser,
  fetchTestAdminUser,
  insertTestAdminUser,
} from "../fixtures";
import * as dynamoDB from "../../model";
import { expectError } from "@libs/testUtils";
import { EncryptCommand, KMSClient } from "@aws-sdk/client-kms";
import { mockClient } from "aws-sdk-client-mock";
import { mocked } from "jest-mock";
import { stringToUint8Array } from "@libs/kms";

const email = faker.internet.email();

const mockedKMS = mockClient(KMSClient as any);

describe("adminUserExists", () => {
  describe("if the admin user does not exist", () => {
    it("returns false", async () => {
      const response = await dynamoDB.documentExists(email);

      expect(response).toEqual(false);
    });
  });

  describe("if the admin user exists", () => {
    const adminUser = createAdminUser({ email });

    beforeEach(async () => {
      await insertTestAdminUser(adminUser);
    });

    afterEach(async () => {
      await deleteTestAdminUser(email);
    });

    it("returns true", async () => {
      const response = await dynamoDB.documentExists(email);

      expect(response).toEqual(true);
    });
  });
});

describe("adminUserPasswordIsSet", () => {
  describe.each([
    ["been set", createAdminUser({ email }), true],
    ["not been set", createAdminUser({ email, passwordHash: "" }), false],
  ])("when the user's password has %s", (_, adminUser, expectedResponse) => {
    beforeEach(async () => {
      await insertTestAdminUser(adminUser);
    });

    afterEach(async () => {
      await deleteTestAdminUser(email);
    });

    it(`returns ${expectedResponse}`, async () => {
      const response = await dynamoDB.userPasswordIsSet(email);

      expect(response).toEqual(expectedResponse);
    });
  });

  describe("when the user does not exist", () => {
    it("throws a NON_EXISTENT_ADMIN_USER error", async () => {
      expect.assertions(1);
      try {
        await dynamoDB.userPasswordIsSet(email);
      } catch (error) {
        expectError(error, dynamoDB.ErrorCodes.NON_EXISTENT_ADMIN_USER);
      }
    });
  });
});

describe("setAdminUserPassword", () => {
  describe("when the user exists", () => {
    const adminUser = createAdminUser({ email, passwordHash: "" });

    describe("when the passwords match", () => {
      const password = faker.internet.password();
      const encryptedPassword = faker.datatype.string(20);
      const encryptedPasswordPlaintext = stringToUint8Array(encryptedPassword);

      describe("when KMS failes to return the hash", () => {
        const password = faker.internet.password();

        beforeEach(async () => {
          await insertTestAdminUser(adminUser);

          mockedKMS.on(EncryptCommand as any).resolves({
            CiphertextBlob: undefined,
          } as any);
        });

        afterEach(async () => {
          await deleteTestAdminUser(email);
        });

        it(`throws a ${dynamoDB.ErrorCodes.ENCRYPTION_FAILED} error`, async () => {
          expect.assertions(1);
          try {
            await dynamoDB.setUserPassword({
              email,
              newPassword: password,
              confirmNewPassword: password,
            });
          } catch (error) {
            expectError(error, dynamoDB.ErrorCodes.ENCRYPTION_FAILED);
          }
        });
      });

      describe("when KMS succeeds in returning the hash", () => {
        beforeEach(async () => {
          await insertTestAdminUser(adminUser);

          mockedKMS.on(EncryptCommand as any).resolves({
            CiphertextBlob: encryptedPasswordPlaintext,
          } as any);
        });

        afterEach(async () => {
          await deleteTestAdminUser(email);
        });

        it("sets the password", async () => {
          await dynamoDB.setUserPassword({
            email,
            newPassword: password,
            confirmNewPassword: password,
          });

          const { passwordHash } = await fetchTestAdminUser(email);

          expect(passwordHash).toEqual(encryptedPassword);
        });
      });
    });

    describe("when the passwords do not match", () => {
      const newPassword = faker.internet.password();
      const confirmNewPassword = faker.internet.password();

      beforeEach(async () => {
        await insertTestAdminUser(adminUser);
      });

      afterEach(async () => {
        await deleteTestAdminUser(email);
      });

      it(`throws a ${dynamoDB.ErrorCodes.PASSWORD_MISMATCH} error`, async () => {
        expect.assertions(1);
        try {
          await dynamoDB.setUserPassword({
            email,
            newPassword,
            confirmNewPassword,
          });
        } catch (error) {
          expectError(error, dynamoDB.ErrorCodes.PASSWORD_MISMATCH);
        }
      });
    });
  });

  describe("when the user does not exist", () => {
    const password = faker.internet.password();

    it(`throws a ${dynamoDB.ErrorCodes.NON_EXISTENT_ADMIN_USER} error`, async () => {
      expect.assertions(1);
      try {
        await dynamoDB.setUserPassword({
          email,
          newPassword: password,
          confirmNewPassword: password,
        });
      } catch (error) {
        expectError(error, dynamoDB.ErrorCodes.NON_EXISTENT_ADMIN_USER);
      }
    });
  });
});
