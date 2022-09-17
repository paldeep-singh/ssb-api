import { faker } from "@faker-js/faker";
import {
  createAdminUser,
  deleteTestAdminUser,
  insertTestAdminUser,
} from "../../fixtures";
import * as dynamoDB from "../adminUsers";

const email = faker.internet.email();

describe("adminUserExists", () => {
  describe("if the admin user does not exist", () => {
    it("returns false", async () => {
      const response = await dynamoDB.adminUserExists(email);

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
      const response = await dynamoDB.adminUserExists(email);

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
      const response = await dynamoDB.adminUserPasswordIsSet(email);

      expect(response).toEqual(expectedResponse);
    });
  });

  describe("when the user does not exist", () => {
    it("returns false", async () => {
      const response = await dynamoDB.adminUserPasswordIsSet(email);

      expect(response).toEqual(false);
    });
  });
});
