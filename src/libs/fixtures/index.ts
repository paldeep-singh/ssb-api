import { faker } from '@faker-js/faker'
import { APIGatewayProxyEvent, Context } from 'aws-lambda'

export const createAPIGatewayProxyEvent = (
  body: Record<string, unknown>,
  eventAttributes: Partial<APIGatewayProxyEvent> = {}
): APIGatewayProxyEvent => {
  return {
    multiValueHeaders: {},
    httpMethod: '',
    isBase64Encoded: false,
    path: '',
    pathParameters: null,
    headers: {
      'Content-Type': 'application/json'
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
