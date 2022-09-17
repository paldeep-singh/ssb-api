import {
  adminUserExists,
  adminUserPasswordIsSet,
} from "../../models/adminUsers";
import { LambdaEventWithResult } from "../../libs/api-gateway";
import { adminUserEmailInput } from "./schema";
import { middyfy } from "../../libs/lambda";

const checkAdminUserExists: LambdaEventWithResult<
  typeof adminUserEmailInput
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

const checkAdminUserPasswordIsSet: LambdaEventWithResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body;

  const passwordIsSet = await adminUserPasswordIsSet(email);

  return {
    statusCode: passwordIsSet ? 200 : 404,
    body: JSON.stringify({
      passwordIsSet,
    }),
  };
};

export const handleCheckAdminUserExists = middyfy(checkAdminUserExists);

export const handleCheckAdminUserPasswordIsSet = middyfy(
  checkAdminUserPasswordIsSet
);
