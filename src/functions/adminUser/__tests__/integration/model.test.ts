import { Faker, faker } from "@faker-js/faker";
import {
  createAdminUser,
  deleteTestAdminUser,
  deleteTestVerificationCode,
  fetchTestAdminUser,
  fetchTestVerificationCode,
  insertTestAdminUser,
} from "../fixtures";
import * as dynamoDB from "../../model";
import * as ErrorCodes from "../../Error";
import { expectError } from "@libs/testUtils";
import { KMSClient } from "@aws-sdk/client-kms";
import { mockClient } from "aws-sdk-client-mock";
import dayjs from "dayjs";

const email = faker.internet.email();
const userId = faker.datatype.uuid();

const mockedKMS = mockClient(KMSClient as any);

describe("userDocumentExists", () => {
  describe("if the admin user does not exist", () => {
    it("returns false", async () => {
      const response = await dynamoDB.userDocumentExists(email);

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
      const response = await dynamoDB.userDocumentExists(email);

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
        expectError(error, ErrorCodes.Codes.NON_EXISTENT_ADMIN_USER);
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
    it(`throws a ${ErrorCodes.Codes.NON_EXISTENT_ADMIN_USER} error`, async () => {
      expect.assertions(1);
      try {
        await dynamoDB.setPassword({
          email,
          newPasswordHash,
          newPasswordSalt,
        });
      } catch (error) {
        expectError(error, ErrorCodes.Codes.NON_EXISTENT_ADMIN_USER);
      }
    });
  });
});

describe("putVerificationCode", () => {
  const userId = faker.datatype.uuid();
  const codeHash = faker.datatype.string(30);
  const codeSalt = faker.datatype.string(10);

  afterEach(async () => {
    await deleteTestVerificationCode(userId);
  });

  it("creates a verification code", async () => {
    await dynamoDB.putVerificationCode({
      userId,
      codeHash,
      codeSalt,
    });

    const response = await fetchTestVerificationCode(userId);

    expect(response).toEqual(
      expect.objectContaining({
        userId,
        codeHash,
        codeSalt,
      })
    );
  });

  it("sets ttl to 5 minutes from now", async () => {
    const now = dayjs();
    const fiveMinutesFromNow = now.add(5, "minutes").startOf("second");
    const sixMinutesFromNow = now.add(6, "minutes");

    await dynamoDB.putVerificationCode({
      userId,
      codeHash,
      codeSalt,
    });

    const response = await fetchTestVerificationCode(userId);

    const ttlDate = dayjs(response.ttl);

    expect(ttlDate.valueOf()).toBeGreaterThanOrEqual(
      fiveMinutesFromNow.valueOf()
    );
    expect(ttlDate.valueOf()).toBeLessThan(sixMinutesFromNow.valueOf());
  });
});

describe("fetchVerificationCode", () => {
  describe("when a verification code for the user exists", () => {
    const userId = faker.datatype.uuid();
    const codeHash = faker.datatype.string(30);
    const codeSalt = faker.datatype.string(10);

    beforeEach(async () => {
      await dynamoDB.putVerificationCode({
        userId,
        codeHash,
        codeSalt,
      });
    });

    afterEach(async () => {
      await deleteTestVerificationCode(email);
    });

    it("returns the verification code", async () => {
      const response = await dynamoDB.fetchVerificationCode(userId);

      expect(response).toEqual(
        expect.objectContaining({
          userId,
          codeHash,
          codeSalt,
        })
      );
    });
  });

  describe("when a verification code for the user does not exist", () => {
    it(`returns undefined`, async () => {
      expect.assertions(1);
      try {
        await dynamoDB.fetchVerificationCode(userId);
      } catch (error) {
        expectError(error, ErrorCodes.Codes.NO_ACTIVE_VERIFICATION_CODE);
      }
    });
  });
});

describe("deleteVerificationCode", () => {
  const userId = faker.datatype.uuid();
  const codeHash = faker.datatype.string(30);
  const codeSalt = faker.datatype.string(10);

  describe("if a verification code exists", () => {
    beforeEach(async () => {
      await dynamoDB.putVerificationCode({
        userId,
        codeHash,
        codeSalt,
      });
    });

    it("deletes the verification code", async () => {
      await dynamoDB.deleteVerificationCode(email);

      const response = await fetchTestVerificationCode(email);

      expect(response).toEqual(undefined);
    });
  });

  describe("if no verification code exists", () => {
    it("does not throw an error", async () => {
      await dynamoDB.deleteVerificationCode(email);
    });
  });
});
