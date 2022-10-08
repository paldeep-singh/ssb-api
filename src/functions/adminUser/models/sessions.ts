import axios from "axios";
import { randomBytes } from "crypto";

export const redisURL = process.env.UPSTASH_REDIS_REST_URL || "";
export const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";

const headers = {
  Authorization: `Bearer ${redisToken}`,
  Accept: "application/json",
  "Content-Type": "application/json",
};

export const createNewSession = async (
  userId: string,
  short: boolean = false
) => {
  const sessionId = randomBytes(32).toString("hex");

  const expiry = 60 * (short ? 5 : 30); // 5 minutes or 30 minutes

  const requestURL = `${redisURL}/set/${sessionId}?EX=${expiry}`;

  const data = {
    userId,
  };

  await axios.post(requestURL, data, { headers });

  return sessionId;
};
