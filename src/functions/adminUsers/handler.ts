import { adminUserExists } from "../../dynamoDB";
import { LambdaEventWithResult } from "../../libs/api-gateway";
import schema from "./schema";
import { middyfy } from "../../libs/lambda";

const checkAdminUserExists: LambdaEventWithResult<typeof schema> = async (
  event
) => {
  const { email } = event.body;

  const userExists = await adminUserExists(email);

  return {
    statusCode: userExists ? 200 : 404,
    body: JSON.stringify({
      adminUserExists: userExists,
    }),
  };
};

export const handleCheckAdminUserExists = middyfy(checkAdminUserExists);
