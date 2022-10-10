import axios from "axios";
import { randomBytes } from "crypto";
import { STAGE } from "@libs/env";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

const getRedisCredentials = async (): Promise<{
  redisURL: string;
  redisToken: string;
}> => {
  if (STAGE === "local") {
    const redisURL = process.env.UPSTASH_REDIS_REST_URL || "";
    const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || "";

    return { redisURL, redisToken };
  }

  const ssm = new SSMClient({});

  const getURLCommand = new GetParameterCommand({
    Name: `${STAGE}_UPSTASH_REDIS_REST_URL`,
  });

  const getTokenCommand = new GetParameterCommand({
    Name: `${STAGE}_UPSTASH_REDIS_REST_TOKEN`,
  });

  const urlParameter = await ssm.send(getURLCommand);

  if (!urlParameter.Parameter)
    throw new Error(`Upstash REST API URL must be provided`);
  else if (!urlParameter.Parameter.Value)
    throw new Error("Invalid value for Upstash REST API URL parameter");

  const tokenParameter = await ssm.send(getTokenCommand);

  if (!tokenParameter.Parameter)
    throw new Error("Upstast REST API token must be provided");
  else if (!tokenParameter.Parameter.Value)
    throw new Error("Invalid value for Upstash REST API token parameter");

  const {
    Parameter: { Value: redisURL },
  } = urlParameter;
  const {
    Parameter: { Value: redisToken },
  } = tokenParameter;

  return {
    redisURL,
    redisToken,
  };
};

export const { redisURL, redisToken } = await getRedisCredentials();

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
