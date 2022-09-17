import { faker } from "@faker-js/faker";
import { Context } from "aws-lambda";
import type { FromSchema, JSONSchema7 } from "json-schema-to-ts";
import { ValidatedAPIGatewayProxyEvent } from "../api-gateway";

export const createAPIGatewayProxyEvent = <requestSchema extends JSONSchema7>(
  eventAttributes: Partial<ValidatedAPIGatewayProxyEvent<requestSchema>> = {}
): ValidatedAPIGatewayProxyEvent<requestSchema> => {
  return {
    body: {} as FromSchema<requestSchema>,
    headers: {},
    multiValueHeaders: {},
    httpMethod: "",
    isBase64Encoded: false,
    path: "",
    pathParameters: null,
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: faker.datatype.uuid(),
      apiId: faker.datatype.uuid(),
      authorizer: {},
      httpMethod: "",
      identity: {
        accessKey: null,
        accountId: null,
        apiKey: null,
        apiKeyId: null,
        caller: null,
        clientCert: null,
        cognitoAuthenticationProvider: null,
        cognitoAuthenticationType: null,
        cognitoIdentityId: null,
        cognitoIdentityPoolId: null,
        principalOrgId: null,
        sourceIp: faker.internet.ip(),
        user: null,
        userAgent: null,
        userArn: null,
      },
      protocol: "https",
      path: "/webhook",
      stage: "Stage",
      requestId: faker.datatype.uuid(),
      requestTimeEpoch: faker.date.recent().getTime(),
      resourceId: faker.datatype.uuid(),
      resourcePath: "/webhook",
    },
    resource: "",
    ...eventAttributes,
  };
};

export const createAPIGatewayProxyEventContext = (
  contextAttributes: Partial<Context> = {}
): Context => {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: "",
    functionVersion: "",
    invokedFunctionArn: "",
    memoryLimitInMB: "",
    awsRequestId: "",
    logGroupName: "",
    logStreamName: "",
    identity: undefined,
    clientContext: undefined,
    getRemainingTimeInMillis: jest.fn(),
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
    ...contextAttributes,
  };
};
