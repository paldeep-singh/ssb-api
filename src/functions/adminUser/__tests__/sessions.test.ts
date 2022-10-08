import { createNewSession, redisToken, redisURL } from "../models/sessions";
import nock from "nock";
import { faker } from "@faker-js/faker";
import { randomBytes } from "crypto";
import { mocked } from "jest-mock";

const redisScope = nock(redisURL);
jest.mock("crypto");

describe("createNewSession", () => {
  const userId = faker.datatype.uuid();
  const sessionBytes = Buffer.from(faker.random.alphaNumeric(32), "hex");

  beforeEach(() => {
    mocked(randomBytes).mockReturnValue(sessionBytes as any);
  });

  describe("when creating a short session", () => {
    beforeEach(() => {
      redisScope
        .post(`/set/${sessionBytes.toString("hex")}?EX=300`, { userId })
        .matchHeader("Authorization", `Bearer ${redisToken}`)
        .reply(200);
    });

    it("sends the request to create a new short session", async () => {
      await createNewSession(userId, true);

      expect(redisScope.isDone()).toBeTruthy();
    });

    it("returns the session id", async () => {
      const sessionId = await createNewSession(userId, true);

      expect(sessionId).toBe(sessionBytes.toString("hex"));
    });
  });

  describe("when creating a long session", () => {
    beforeEach(() => {
      redisScope
        .post(`/set/${sessionBytes.toString("hex")}?EX=1800`, { userId })
        .matchHeader("Authorization", `Bearer ${redisToken}`)
        .reply(200);
    });

    it("sends the request to create a new long session", async () => {
      await createNewSession(userId);

      expect(redisScope.isDone()).toBeTruthy();
    });

    it("returns the session id", async () => {
      const sessionId = await createNewSession(userId);

      expect(sessionId).toBe(sessionBytes.toString("hex"));
    });
  });
});
