import type {
  APIGatewayProxyEvent,
  APIGatewayProxyResult,
  Callback,
  Context,
  Handler,
} from "aws-lambda";
import type { FromSchema, JSONSchema7 } from "json-schema-to-ts";

export type ValidatedAPIGatewayProxyEvent<requestSchema extends JSONSchema7> =
  Omit<APIGatewayProxyEvent, "body"> & {
    body: FromSchema<requestSchema>;
  };

type HandlerWithResult<TEvent = any, TResult = any> = (
  event: TEvent,
  context: Context,
  callback: Callback<TResult>
) => Promise<TResult>;

export type LambdaEventWithResult<requestSchema extends JSONSchema7> =
  HandlerWithResult<
    ValidatedAPIGatewayProxyEvent<requestSchema>,
    APIGatewayProxyResult
  >;

export const formatJSONResponse = (response: Record<string, unknown>) => {
  return {
    statusCode: 200,
    body: JSON.stringify(response),
  };
};
