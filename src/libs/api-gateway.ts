import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context
} from 'aws-lambda';
import type { FromSchema, JSONSchema7 } from 'json-schema-to-ts';

export type ValidatedAPIGatewayProxyEvent<requestSchema extends JSONSchema7> =
  Omit<APIGatewayProxyEvent, 'body'> & {
    body: FromSchema<requestSchema>;
  };

type HandlerWithResult<TEvent, TResult> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>
) => Promise<TResult>;

export type LambdaEventWithResult<requestSchema extends JSONSchema7> =
  HandlerWithResult<
    ValidatedAPIGatewayProxyEvent<requestSchema>,
    APIGatewayProxyResult
  >;

export const formatJSONResponse = (
  statusCode: number,
  response: Record<string, unknown>
) => {
  return {
    statusCode,
    body: JSON.stringify(response)
  };
};

export const formatJSONErrorResponse = (
  statusCode: number,
  message: string
) => {
  return formatJSONResponse(statusCode, { message });
};
