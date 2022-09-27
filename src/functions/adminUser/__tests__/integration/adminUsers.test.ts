import { faker } from "@faker-js/faker";
import {
  userDocumentExists,
  fetchUserByEmail,
  setPassword,
} from "../../models/adminUsers";
import { expectError } from "@libs/testUtils";
import {
  createAdminUser,
  insertTestAdminUser,
  deleteTestAdminUser,
  fetchTestAdminUser,
} from "../fixtures";
import { ErrorCodes } from "../../misc";

const email = faker.internet.email();
const userId = faker.datatype.uuid();

describe("userDocumentExists", () => {
  describe("if the admin user does not exist", () => {
    it("returns false", async () => {
      const response = await userDocumentExists(email);

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
      const response = await userDocumentExists(email);

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
      const response = await fetchUserByEmail(email);

      expect(response).toEqual(adminUser);
    });
  });

  describe("when the user does not exist", () => {
    it("throws a NON_EXISTENT_ADMIN_USER error", async () => {
      expect.assertions(1);
      try {
        await fetchUserByEmail(email);
      } catch (error) {
        expectError(error, ErrorCodes.NON_EXISTENT_ADMIN_USER);
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
      await setPassword({
        email,
        newPasswordHash: newPasswordHash,
        newPasswordSalt: newPasswordSalt,
      });

      const { passwordHash } = await fetchTestAdminUser(userId);

      expect(passwordHash).toEqual(newPasswordHash);
    });

    it("sets new password Salt", async () => {
      await setPassword({
        email,
        newPasswordHash: newPasswordHash,
        newPasswordSalt: newPasswordSalt,
      });

      const { passwordSalt } = await fetchTestAdminUser(userId);

      expect(passwordSalt).toEqual(newPasswordSalt);
    });
  });

  describe("when the user does not exist", () => {
    it(`throws a ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error`, async () => {
      expect.assertions(1);
      try {
        await setPassword({
          email,
          newPasswordHash,
          newPasswordSalt,
        });
      } catch (error) {
        expectError(error, ErrorCodes.NON_EXISTENT_ADMIN_USER);
      }
    });
  });
});