import { APIGatewayEvent } from "aws-lambda";
import { adminUserExists } from "../../dynamoDB";
import { LambdaEventWithResult } from "../../libs/api-gateway";
import schema from "./schema";

export const handleAdminUserExists: LambdaEventWithResult<
  typeof schema
> = async (event) => {
  const { email } = event.body;

  const userExists = await adminUserExists(email);

  return {
    statusCode: userExists ? 200 : 404,
    body: JSON.stringify({
      adminUserExists: userExists,
    }),
  };
};
