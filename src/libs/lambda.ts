import middy from '@middy/core';
import middyJsonBodyParser from '@middy/http-json-body-parser';

type MiddyInputHandler = Parameters<typeof middy>[0];

export const middyfy = (handler: MiddyInputHandler) => {
  return middy(handler).use(middyJsonBodyParser());
};
