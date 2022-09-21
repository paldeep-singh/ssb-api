import { adminUserExists, adminUserPasswordIsSet, ErrorCodes } from "./model";
import {
  LambdaEventWithResult,
  formatJSONResponse,
  formatJSONErrorResponse,
} from "@libs/api-gateway";
import { adminUserEmailInput } from "./schema";
import { middyfy } from "@libs/lambda";
import { isError } from "@libs/utils";
import { stubTrue } from "lodash";

const checkAdminUserExists: LambdaEventWithResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body;

  const userExists = await adminUserExists(email);

  const statusCode = userExists ? 200 : 404;

  return formatJSONResponse(statusCode, {
    adminUserExists: userExists,
  });
};

const checkAdminUserPasswordIsSet: LambdaEventWithResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body;
  try {
    const passwordIsSet = await adminUserPasswordIsSet(email);

    const statusCode = passwordIsSet ? 200 : 404;

    return formatJSONResponse(statusCode, { passwordIsSet });
  } catch (error) {
    if (!isError(error)) throw error;

    if (error.message === ErrorCodes.NON_EXISTENT_ADMIN_USER) {
      return formatJSONErrorResponse(404, error.message);
    }

    throw error;
  }
};

export const handleCheckAdminUserExists = middyfy(checkAdminUserExists);

export const handleCheckAdminUserPasswordIsSet = middyfy(
  checkAdminUserPasswordIsSet
);
