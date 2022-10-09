import axios from "axios";
import { randomBytes } from "crypto";

export const redisURL = process.env.UPSTASH_REDIS_REST_URL || "";
export const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";

const FIVE_MINUTES = 60 * 5;
const THIRTY_MINUTES = 60 * 30;

const headers = {
  Authorization: `Bearer ${redisToken}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

interface ISessionData {
  userId: string;
}

interface ISession {
  sessionId: string;
  sessionData: ISessionData;
}

export const createNewSession = async (
  userId: string,
  short: boolean = false
): Promise<ISession> => {
  const sessionId = randomBytes(32).toString("hex");

  const expiry = short ? FIVE_MINUTES : THIRTY_MINUTES;

  const requestURL = `${redisURL}/set/${sessionId}?EX=${expiry}`;

  const data = {
    userId,
  };

  await axios.post(requestURL, data, { headers });

  return {
    sessionId,
    sessionData: data,
  };
};

export const updateSession = async (
  sessionId: string,
  sessionData: ISessionData
): Promise<ISession> => {
  const requestURL = `${redisURL}/set/${sessionId}?EX=${THIRTY_MINUTES}`;

  await axios.post(requestURL, sessionData, { headers });

  return {
    sessionId,
    sessionData: sessionData,
  };
};

export const fetchSession = async (
  sessionId: string
): Promise<ISession | null> => {
  const requestURL = `${redisURL}/get/${sessionId}`;

  const response = await axios.get<{ result: ISessionData | null }>(
    requestURL,
    {
      headers,
    }
  );

  if (!response.data.result) {
    return null;
  }

  const data = response.data.result;

  return {
    sessionId,
    sessionData: data,
  };
};
