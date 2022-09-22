import {
  documentExists,
  userPasswordIsSet,
  ErrorCodes,
  setPassword,
} from "./model";
import {
  LambdaEventWithResult,
  formatJSONResponse,
  formatJSONErrorResponse,
} from "@libs/api-gateway";
import { adminUserEmailInput, adminUserSetPasswordInput } from "./schema";
import { middyfy } from "@libs/lambda";
import { isError } from "@libs/utils";

const checkAdminUserExists: LambdaEventWithResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body;

  const userExists = await documentExists(email);

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
    const passwordIsSet = await userPasswordIsSet(email);

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

const setAdminUserPassword: LambdaEventWithResult<
  typeof adminUserSetPasswordInput
> = async (event) => {
  const { email, newPassword, confirmNewPassword } = event.body;

  if (newPassword !== confirmNewPassword) {
    return formatJSONErrorResponse(400, ErrorCodes.PASSWORD_MISMATCH);
  }

  if (!(await documentExists(email))) {
    return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER);
  }

  try {
    await setPassword({ email, newPassword });
    return formatJSONResponse(200, { passwordSet: true });
  } catch (error) {
    if (!isError(error)) throw error;

    if (error.message === ErrorCodes.ENCRYPTION_FAILED) {
      return formatJSONErrorResponse(502, error.message);
    }

    throw error;
  }
};

export const handleCheckAdminUserExists = middyfy(checkAdminUserExists);

export const handleCheckAdminUserPasswordIsSet = middyfy(
  checkAdminUserPasswordIsSet
);

export const handleSetAdminUserPassword = middyfy(setAdminUserPassword);
