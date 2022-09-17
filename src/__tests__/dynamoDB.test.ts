import { faker } from "@faker-js/faker";
import {
  createAdminUser,
  deleteTestAdminUser,
  insertTestAdminUser,
} from "../fixtures";
import * as dynamoDB from "../dynamoDB";

describe("adminUserExists", () => {
  describe("if the admin user does not exist", () => {
    const email = faker.internet.email();

    it("returns false", async () => {
      const response = await dynamoDB.adminUserExists(email);

      expect(response).toBe(false);
    });
  });

  describe("if the admin user exists", () => {
    const email = faker.internet.email();

    const adminUser = createAdminUser({ email });

    beforeAll(async () => {
      await insertTestAdminUser(adminUser);
    });

    afterAll(async () => {
      await deleteTestAdminUser(email);
    });

    it("returns true", async () => {
      const response = await dynamoDB.adminUserExists(email);

      expect(response).toBe(true);
    });
  });
});
