import { faker } from '@faker-js/faker'
import { APIGatewayProxyEventWithAuthorisationHeader } from '@libs/api-gateway'
import {
  APIGatewayProxyEvent,
  APIGatewayTokenAuthorizerEvent,
  Context
} from 'aws-lambda'

export const createAPIGatewayProxyEvent = (
  body: Record<string, unknown> = {},
  headers: Record<string, string> = {},
  eventAttributes: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent => {
  return {
    multiValueHeaders: {},
    httpMethod: '',
    isBase64Encoded: false,
    path: '',
    pathParameters: null,
    headers: {
      'Content-Type': 'application/json',
      ...headers
    },
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    stageVariables: null,
    requestContext: {
      accountId: faker.datatype.uuid(),
      apiId: faker.datatype.uuid(),
      authorizer: {},
      httpMethod: '',
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
        userArn: null
      },
      protocol: 'https',
      path: '/webhook',
      stage: 'Stage',
      requestId: faker.datatype.uuid(),
      requestTimeEpoch: faker.date.recent().getTime(),
      resourceId: faker.datatype.uuid(),
      resourcePath: '/webhook'
    },
    resource: '',
    ...eventAttributes,
    body: JSON.stringify(body)
  }
}

export const createAPIGatewayProxyEventWithAuthorisationHeader = (
  body: Record<string, unknown> = {},
  authorisationHeader: string,
  headers: Record<string, string> = {},
  eventAttributes: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEventWithAuthorisationHeader => {
  return createAPIGatewayProxyEvent(
    body,
    { ...headers, Authorization: authorisationHeader },
    eventAttributes
  ) as APIGatewayProxyEventWithAuthorisationHeader
}

export const createAPIGatewayProxyEventContext = (
  contextAttributes: Partial<Context> = {}
): Context => {
  return {
    callbackWaitsForEmptyEventLoop: false,
    functionName: '',
    functionVersion: '',
    invokedFunctionArn: '',
    memoryLimitInMB: '',
    awsRequestId: '',
    logGroupName: '',
    logStreamName: '',
    identity: undefined,
    clientContext: undefined,
    getRemainingTimeInMillis: jest.fn(),
    done: jest.fn(),
    fail: jest.fn(),
    succeed: jest.fn(),
    ...contextAttributes
  }
}

export const createTokenAuthorisationEvent = (
  eventAttributes: Partial<APIGatewayTokenAuthorizerEvent>
): APIGatewayTokenAuthorizerEvent => ({
  type: 'TOKEN',
  methodArn: faker.datatype.uuid(),
  authorizationToken: faker.datatype.uuid(),
  ...eventAttributes
})
