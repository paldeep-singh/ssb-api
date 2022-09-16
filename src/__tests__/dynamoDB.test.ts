import { faker } from "@faker-js/faker";
import {
  createAdminUser,
  deleteTestAdminUser,
  insertTestAdminUser,
} from "../testFixtures";
import * as dynamoDB from "../dynamoDB";

describe("adminUserExists", () => {
  describe("if the user does not exist", () => {
    const email = faker.internet.email();

    it("returns false", async () => {
      const response = await dynamoDB.adminUserExists(email);

      expect(response).toBe(false);
    });
  });
});
