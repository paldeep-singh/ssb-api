import { hello } from "./hello";
import { APIGatewayEvent } from "aws-lambda";

export const handleHello = async (event: APIGatewayEvent) => {
  const { body } = event;

  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({
        message: `Error! Name is required`,
      }),
    };
  }

  return await hello(body);
};
