import middy, { MiddyfiedHandler } from '@middy/core';
import middyJsonBodyParser, {
  Event as ParsedAPIGatewayEvent
} from '@middy/http-json-body-parser';

type MiddyInputHandler = Parameters<typeof middy>[0];
type MiddyfiedAPIGatewayHandler = MiddyfiedHandler<ParsedAPIGatewayEvent>;

export const middyfy = (
  handler: MiddyInputHandler
): MiddyfiedAPIGatewayHandler => {
  return middy(handler).use(middyJsonBodyParser());
};
