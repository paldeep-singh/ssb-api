import axios, { AxiosRequestHeaders } from "axios";
import { randomBytes } from "crypto";
import { STAGE } from "@libs/env";
import { SSMClient, GetParameterCommand } from "@aws-sdk/client-ssm";

export const getRedisURL = async (): Promise<string> => {
  if (STAGE === "local") {
    return process.env.UPSTASH_REDIS_REST_URL || "";
  }

  const ssm = new SSMClient({});

  const getURLCommand = new GetParameterCommand({
    Name: `${STAGE}_UPSTASH_REDIS_REST_URL`,
  });

  const urlParameter = await ssm.send(getURLCommand);

  if (!urlParameter.Parameter)
    throw new Error(`Upstash REST API URL must be provided`);
  else if (!urlParameter.Parameter.Value)
    throw new Error("Invalid value for Upstash REST API URL parameter");

  const {
    Parameter: { Value: redisURL },
  } = urlParameter;

  return redisURL;
};

const getRedisToken = async (): Promise<string> => {
  if (STAGE === "local") {
    return process.env.UPSTASH_REDIS_REST_TOKEN || "";
  }

  const ssm = new SSMClient({});

  const getTokenCommand = new GetParameterCommand({
    Name: `${STAGE}_UPSTASH_REDIS_REST_TOKEN`,
  });

  const tokenParameter = await ssm.send(getTokenCommand);

  if (!tokenParameter.Parameter)
    throw new Error("Upstast REST API token must be provided");
  else if (!tokenParameter.Parameter.Value)
    throw new Error("Invalid value for Upstash REST API token parameter");

  const {
    Parameter: { Value: redisToken },
  } = tokenParameter;

  return redisToken;
};

export const getRedisHeaders = async (): Promise<
  Partial<AxiosRequestHeaders>
> => {
  const redisToken = await getRedisToken();

  return {
    Authorization: `Bearer ${redisToken}`,
    Accept: "application/json",
    "Content-Type": "application/json",
  };
};

const FIVE_MINUTES = 60 * 5;
const THIRTY_MINUTES = 60 * 30;

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
  const redisURL = await getRedisURL();
  const sessionId = randomBytes(32).toString("hex");

  const expiry = short ? FIVE_MINUTES : THIRTY_MINUTES;

  const requestURL = `${redisURL}/set/${sessionId}?EX=${expiry}`;

  const data = {
    userId,
  };

  const headers = await getRedisHeaders();

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
  const redisURL = await getRedisURL();
  const requestURL = `${redisURL}/set/${sessionId}?EX=${THIRTY_MINUTES}`;
  const headers = await getRedisHeaders();

  await axios.post(requestURL, sessionData, { headers });

  return {
    sessionId,
    sessionData: sessionData,
  };
};

export const fetchSession = async (
  sessionId: string
): Promise<ISession | null> => {
  const redisURL = await getRedisURL();
  const requestURL = `${redisURL}/get/${sessionId}`;

  const headers = await getRedisHeaders();

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
