import {
  documentExists,
  fetchUserByEmail,
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
import { randomBytes } from "crypto";
import { kmsClient, stringToUint8Array, Uint8ArrayToStr } from "@libs/kms";
import { ADMIN_USER_PASSWORD_KEY_ALIAS } from "./resources";
import { EncryptCommand } from "@aws-sdk/client-kms";

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
    const user = await fetchUserByEmail(email);

    const passwordIsSet = !!user.passwordHash && !!user.passwordSalt;

    return formatJSONResponse(200, { passwordIsSet });
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

  if (!(await documentExists(email))) {
    return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER);
  }

  if (newPassword !== confirmNewPassword) {
    return formatJSONErrorResponse(400, ErrorCodes.PASSWORD_MISMATCH);
  }

  const newPasswordSalt = randomBytes(256).toString();

  const Plaintext = stringToUint8Array(newPassword + newPasswordSalt);

  const encrypt = new EncryptCommand({
    KeyId: ADMIN_USER_PASSWORD_KEY_ALIAS,
    Plaintext,
  });

  const { CiphertextBlob } = await kmsClient.send(encrypt);

  if (!CiphertextBlob)
    return formatJSONErrorResponse(502, ErrorCodes.ENCRYPTION_FAILED);

  const newPasswordHash = Uint8ArrayToStr(CiphertextBlob);

  await setPassword({ email, newPasswordHash, newPasswordSalt });
  return formatJSONResponse(200, { passwordSet: true });
};

export const handleCheckAdminUserExists = middyfy(checkAdminUserExists);

export const handleCheckAdminUserPasswordIsSet = middyfy(
  checkAdminUserPasswordIsSet
);

export const handleSetAdminUserPassword = middyfy(setAdminUserPassword);
