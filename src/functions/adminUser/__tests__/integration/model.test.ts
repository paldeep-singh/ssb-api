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
import { stringToUint8Array } from "@libs/kms";

const email = faker.internet.email();
const userId = faker.datatype.uuid();

const mockedKMS = mockClient(KMSClient as any);

describe("adminUserExists", () => {
  describe("if the admin user does not exist", () => {
    it("returns false", async () => {
      const response = await dynamoDB.documentExists(email);

      expect(response).toEqual(false);
    });
  });

  describe("if the admin user exists", () => {
    const adminUser = createAdminUser({ userId, email });

    beforeEach(async () => {
      await insertTestAdminUser(adminUser);
    });

    afterEach(async () => {
      await deleteTestAdminUser(userId);
    });

    it("returns true", async () => {
      const response = await dynamoDB.documentExists(email);

      expect(response).toEqual(true);
    });
  });
});

describe("fetchUserByEmail", () => {
  describe("when the user exists", () => {
    const adminUser = createAdminUser({ userId, email });

    beforeEach(async () => {
      await insertTestAdminUser(adminUser);
    });

    afterEach(async () => {
      await deleteTestAdminUser(userId);
    });

    it("returns the user", async () => {
      const response = await dynamoDB.fetchUserByEmail(email);

      expect(response).toEqual(adminUser);
    });
  });

  describe("when the user does not exist", () => {
    it("throws a NON_EXISTENT_ADMIN_USER error", async () => {
      expect.assertions(1);
      try {
        await dynamoDB.fetchUserByEmail(email);
      } catch (error) {
        expectError(error, dynamoDB.ErrorCodes.NON_EXISTENT_ADMIN_USER);
      }
    });
  });
});

describe("setAdminUserPassword", () => {
  const newPasswordHash = faker.datatype.string(50);
  const newPasswordSalt = faker.datatype.string(20);

  describe("when the user exists", () => {
    const adminUser = createAdminUser({
      userId,
      email,
      passwordHash: "",
      passwordSalt: "",
    });

    beforeEach(async () => {
      await insertTestAdminUser(adminUser);
    });

    afterEach(async () => {
      await deleteTestAdminUser(userId);
    });

    it("sets the password", async () => {
      await dynamoDB.setPassword({
        email,
        newPasswordHash: newPasswordHash,
        newPasswordSalt: newPasswordSalt,
      });

      const { passwordHash } = await fetchTestAdminUser(userId);

      expect(passwordHash).toEqual(newPasswordHash);
    });

    it("sets new password Salt", async () => {
      await dynamoDB.setPassword({
        email,
        newPasswordHash: newPasswordHash,
        newPasswordSalt: newPasswordSalt,
      });

      const { passwordSalt } = await fetchTestAdminUser(userId);

      expect(passwordSalt).toEqual(newPasswordSalt);
    });
  });

  describe("when the user does not exist", () => {
    it(`throws a ${dynamoDB.ErrorCodes.NON_EXISTENT_ADMIN_USER} error`, async () => {
      expect.assertions(1);
      try {
        await dynamoDB.setPassword({
          email,
          newPasswordHash,
          newPasswordSalt,
        });
      } catch (error) {
        expectError(error, dynamoDB.ErrorCodes.NON_EXISTENT_ADMIN_USER);
      }
    });
  });
});
