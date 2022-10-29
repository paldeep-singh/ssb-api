import type {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Callback,
  Context,
  APIGatewayRequestAuthorizerEvent,
  APIGatewayProxyWithLambdaAuthorizerEventRequestContext
} from 'aws-lambda'
import { AuthoriserStatement } from './iam'
import type { FromSchema, JSONSchema7 } from 'json-schema-to-ts'

export type ValidatedAPIGatewayProxyEvent<requestSchema extends JSONSchema7> =
  Omit<APIGatewayProxyEvent, 'body'> & {
    body: FromSchema<requestSchema>
  }

type HandlerWithResult<TEvent, TResult> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>
) => Promise<TResult>

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
  requestSchema extends JSONSchema7,
  TResult = APIGatewayProxyResult
> = HandlerWithResult<ValidatedAPIGatewayProxyEvent<requestSchema>, TResult>

type ApiGateWayResponse = {
  statusCode: number
  body: string
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
  response: Record<string, unknown>
): ApiGateWayResponse => {
  return {
    statusCode,
    body: JSON.stringify(response)
  }
}

export const formatJSONErrorResponse = (
  statusCode: number,
  message: string
): ApiGateWayResponse => {
  return formatJSONResponse(statusCode, { message })
}

export const jsonDeserializer =
  <requestParams extends JSONSchema7>() =>
  (handler: LambdaEventWithSchemaAndResult<requestParams>) =>
  async (
    event: APIGatewayProxyEvent,
    context: Context,
    callback: Callback<APIGatewayProxyResult>
  ): Promise<APIGatewayProxyResult> => {
    const { body, headers, isBase64Encoded } = event

    const mimePattern = /^application\/(.+\+)?json(;.*)?$/

    const contentType = headers['Content-Type'] ?? headers['content-type'] ?? ''

    if (!body || !mimePattern.test(contentType)) {
      throw new Error('Invalid request params')
    }

    const data = isBase64Encoded ? Buffer.from(body, 'base64').toString() : body

    const bodyObject = JSON.parse(data) as FromSchema<requestParams>

    return await handler({ ...event, body: bodyObject }, context, callback)
  }

export const bodyParser = <requestSchema extends JSONSchema7>(
  handler: LambdaEventWithSchemaAndResult<requestSchema>
): ((
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
) => Promise<APIGatewayProxyResult>) => {
  return jsonDeserializer<requestSchema>()(handler)
}
