import type {
  APIGatewayProxyResult,
  APIGatewayProxyEvent,
  Callback,
  Context
} from 'aws-lambda'
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

export type LambdaEventWithResult<requestSchema extends JSONSchema7> =
  HandlerWithResult<
    ValidatedAPIGatewayProxyEvent<requestSchema>,
    APIGatewayProxyResult
  >

type ApiGateWayResponse = {
  statusCode: number
  body: string
}

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
  (handler: LambdaEventWithResult<requestParams>) =>
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
  handler: LambdaEventWithResult<requestSchema>
): ((
  event: APIGatewayProxyEvent,
  context: Context,
  callback: Callback<APIGatewayProxyResult>
) => Promise<APIGatewayProxyResult>) => {
  return jsonDeserializer<requestSchema>()(handler)
}
