import { faker } from "@faker-js/faker";
import {
  adminUserEmailExists,
  fetchUserByEmail,
  updatePassword,
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

describe("adminUserEmailExists", () => {
  describe("if the admin user does not exist", () => {
    it("returns false", async () => {
      const response = await adminUserEmailExists(email);

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
      const response = await adminUserEmailExists(email);

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
    });

    beforeEach(async () => {
      await insertTestAdminUser(adminUser);
    });

    afterEach(async () => {
      await deleteTestAdminUser(userId);
    });

    it("sets the password", async () => {
      await updatePassword({
        email,
        newPasswordHash: newPasswordHash,
      });

      const { passwordHash } = await fetchTestAdminUser(userId);

      expect(passwordHash).toEqual(newPasswordHash);
    });
  });

  describe("when the user does not exist", () => {
    it(`throws a ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error`, async () => {
      expect.assertions(1);
      try {
        await updatePassword({
          email,
          newPasswordHash,
        });
      } catch (error) {
        expectError(error, ErrorCodes.NON_EXISTENT_ADMIN_USER);
      }
    });
  });
});
