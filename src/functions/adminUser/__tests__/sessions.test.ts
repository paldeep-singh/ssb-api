import {
  createNewSession,
  fetchSession,
  updateSession,
} from "../models/sessions";
import nock from "nock";
import { faker } from "@faker-js/faker";
import { randomBytes } from "crypto";
import { mocked } from "jest-mock";
import { mockClient } from "aws-sdk-client-mock";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const redisURL = faker.internet.url();
const redisToken = faker.datatype.uuid();
const redisScope = nock(redisURL);
jest.mock("crypto");
const ssmMock = mockClient(SSMClient);

beforeEach(() => {
  ssmMock.reset();
});

describe("createNewSession", () => {
  const userId = faker.datatype.uuid();
  const sessionBytes = Buffer.from(faker.random.alphaNumeric(32), "hex");

  beforeEach(() => {
    mocked(randomBytes).mockReturnValue(sessionBytes as unknown as void);

    ssmMock
      .on(GetParameterCommand)
      .resolvesOnce({
        Parameter: {
          Value: redisURL,
        },
      })
      .resolvesOnce({
        Parameter: {
          Value: redisToken,
        },
      });
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

    it("returns the session", async () => {
      const session = await createNewSession(userId, true);

      expect(session).toEqual({
        sessionId: sessionBytes.toString("hex"),
        sessionData: { userId },
      });
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
      const session = await createNewSession(userId);

      expect(session).toEqual({
        sessionId: sessionBytes.toString("hex"),
        sessionData: { userId },
      });
    });
  });
});

describe("updateSession", () => {
  const userId = faker.datatype.uuid();
  const sessionId = faker.random.alphaNumeric(32);

  beforeEach(() => {
    redisScope
      .post(`/set/${sessionId}?EX=1800`, { userId })
      .matchHeader("Authorization", `Bearer ${redisToken}`)
      .reply(200);

    ssmMock
      .on(GetParameterCommand)
      .resolvesOnce({
        Parameter: {
          Value: redisURL,
        },
      })
      .resolvesOnce({
        Parameter: {
          Value: redisToken,
        },
      });
  });

  it("sends the request to update the session", async () => {
    await updateSession(sessionId, { userId });

    expect(redisScope.isDone()).toBeTruthy();
  });
});

describe("fetchSession", () => {
  const userId = faker.datatype.uuid();
  const sessionId = faker.random.alphaNumeric(32);

  beforeEach(() => {
    ssmMock
      .on(GetParameterCommand)
      .resolvesOnce({
        Parameter: {
          Value: redisURL,
        },
      })
      .resolvesOnce({
        Parameter: {
          Value: redisToken,
        },
      });
  });

  describe("when the session exists", () => {
    beforeEach(() => {
      redisScope
        .get(`/get/${sessionId}`)
        .matchHeader("Authorization", `Bearer ${redisToken}`)
        .reply(200, { result: { userId } });
    });

    it("sends the request to fetch the session", async () => {
      await fetchSession(sessionId);

      expect(redisScope.isDone()).toBeTruthy();
    });

    it("returns the session data", async () => {
      const session = await fetchSession(sessionId);

      expect(session).toEqual({
        sessionId,
        sessionData: {
          userId,
        },
      });
    });
  });

  describe("when the session does not exist", () => {
    beforeEach(() => {
      redisScope
        .get(`/get/${sessionId}`)
        .matchHeader("Authorization", `Bearer ${redisToken}`)
        .reply(200, {
          result: null,
        });
    });

    it("returns null", async () => {
      const session = await fetchSession(sessionId);

      expect(session).toBeNull();
    });
  });
});
