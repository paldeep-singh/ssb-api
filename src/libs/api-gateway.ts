import type {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Callback,
  Context,
  APIGatewayRequestAuthorizerEvent,
  APIGatewayProxyWithLambdaAuthorizerEventRequestContext
} from 'aws-lambda'
import { AuthoriserStatement } from './iam'
import type { FromSchema } from 'json-schema-to-ts'

export type ValidatedAPIGatewayProxyEvent<requestSchema> = Omit<
  APIGatewayProxyEvent,
  'body'
> & {
  body: requestSchema
}

export type APIGatewayProxyEventWithAuthorisationHeader = Omit<
  APIGatewayProxyEvent,
  'headers'
> & {
  headers: {
    Authorization: string
    [name: string]: string | undefined
  }
}

export type ValidatedAPIGatewayProxyEventWithAuthorisationHeader<
  requestSchema
> = Omit<APIGatewayProxyEventWithAuthorisationHeader, 'body'> & {
  body: requestSchema
}

type HandlerWithResult<TEvent, TResult> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>
) => Promise<TResult>

export type IEmptyInputType = null

type APIGatewayRequestAuthoriserEventWithContext<
  TAuthoriserContext = Record<string, string | null>
> = APIGatewayRequestAuthorizerEvent & {
  requestContext: APIGatewayProxyWithLambdaAuthorizerEventRequestContext<TAuthoriserContext>
} & {
  body: string | null
}

export type CustomAuthoriserResult = {
  principalId: string // The principal user identification associated with the token sent by the client.
  policyDocument: {
    Version: '2012-10-17'
    Statement: AuthoriserStatement[]
  }
  context?: Record<string, unknown>
  usageIdentifierKey?: string
}

export type LamdaCustomAuthoriserHandler = (
  event: APIGatewayRequestAuthoriserEventWithContext
) => Promise<CustomAuthoriserResult>

export type LambdaEventWithUnknownSchema<
  TResult,
  TRequest = string
> = HandlerWithResult<
  Omit<APIGatewayProxyEvent, 'body'> & {
    body: TRequest | null
  },
  TResult
>

export type LambdaEventWithSchemaAndResult<
  requestSchema = IEmptyInputType,
  TResult = APIGatewayProxyResult
> = HandlerWithResult<ValidatedAPIGatewayProxyEvent<requestSchema>, TResult>

export type LambdaEventWithSchemaAndAuthorisationHeaderAndResult<
  requestSchema = IEmptyInputType,
  TResult = APIGatewayProxyResult
> = HandlerWithResult<
  ValidatedAPIGatewayProxyEventWithAuthorisationHeader<requestSchema>,
  TResult
>

type ApiGateWayResponse = {
  statusCode: number
  body: string
  headers: Record<string, string | boolean | number>
}

// export type APIGatewayAuthoriserResource = {
//   Type: 'AWS::ApiGateway::Authorizer'
//   Properties: {
//     AuthorizerCredentials?: string
//     AuthorizerResultTtlInSeconds?: number
//     AuthorizerUri?: string
//     AuthType?: string
//     IdentitySource: string
//     IdentityValidationExpression: string
//     Name: string
//     ProviderARNs: string[]
//     RestApiId: string
//     Type: string
//   }
// }

export const formatJSONResponse = (
  statusCode: number,
  response: Record<string, unknown> = {}
): ApiGateWayResponse => {
  return {
    statusCode,
    headers: {
      'Access-Control-Allow-Origin': 'http://localhost:3164',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify(response)
  }
}

export const formatJSONErrorResponse = (
  statusCode: number,
  message: string
): ApiGateWayResponse => {
  return formatJSONResponse(statusCode, { message })
}

const parseBody = <requestSchema>(
  body: string | null,
  isBase64Encoded: boolean,
  headers: Record<string, string | undefined>
): requestSchema => {
  const mimePattern = /^application\/(.+\+)?json(;.*)?$/

  const contentType = headers['Content-Type'] ?? headers['content-type'] ?? ''

  if (!body || !mimePattern.test(contentType)) {
    throw new Error('Invalid request params')
  }

  const data = isBase64Encoded ? Buffer.from(body, 'base64').toString() : body

  return JSON.parse(data) as requestSchema
}

const jsonDeserializer =
  <requestSchema>() =>
  (handler: LambdaEventWithSchemaAndResult<requestSchema>) =>
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    callback: Callback<APIGatewayProxyResult>
  ): Promise<APIGatewayProxyResult> => {
    const { body, headers, isBase64Encoded } = event

    const bodyObject = parseBody<requestSchema>(body, isBase64Encoded, headers)

    return await handler({ ...event, body: bodyObject }, context, callback)
  }

const jsonDeserializerWithAuthorisationHeader =
  <requestSchema>() =>
  (
    handler: LambdaEventWithSchemaAndAuthorisationHeaderAndResult<requestSchema>
  ) =>
  async (
    event: APIGatewayProxyEventWithAuthorisationHeader,
    context: Context,
    callback: Callback<APIGatewayProxyResult>
  ): Promise<APIGatewayProxyResult> => {
    const { body, headers, isBase64Encoded } = event

    const bodyObject = parseBody<requestSchema>(body, isBase64Encoded, headers)

    return await handler({ ...event, body: bodyObject }, context, callback)
  }

export const bodyParser = <requestSchema>(
  handler: LambdaEventWithSchemaAndResult<requestSchema>
): ((
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
) => Promise<APIGatewayProxyResult>) => {
  return jsonDeserializer<requestSchema>()(handler)
}

export const bodyParserWithAuthorisationHeader = <
  requestSchema = IEmptyInputType
>(
  handler: LambdaEventWithSchemaAndAuthorisationHeaderAndResult<requestSchema>
): ((
  event: APIGatewayProxyEventWithAuthorisationHeader,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
) => Promise<APIGatewayProxyResult>) => {
  return jsonDeserializerWithAuthorisationHeader<requestSchema>()(handler)
}
