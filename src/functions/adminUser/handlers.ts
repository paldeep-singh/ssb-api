import {
  userDocumentExists,
  fetchUserByEmail,
  ErrorCodes,
  setPassword,
} from "./model";
import {
  LambdaEventWithResult,
  formatJSONResponse,
  formatJSONErrorResponse,
} from "@libs/api-gateway";
import {
  adminUserEmailInput,
  adminUserSetPasswordInput,
  adminUserVerifyPasswordInput,
} from "./schema";
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

  const userExists = await userDocumentExists(email);

  const statusCode = userExists ? 200 : 404;

  return formatJSONResponse(statusCode, {
    adminUserExists: userExists,
  });
};

const checkAdminUserAccountIsClaimed: LambdaEventWithResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body;
  try {
    const user = await fetchUserByEmail(email);

    const accountClaimed = !!user.passwordHash && !!user.passwordSalt;

    return formatJSONResponse(200, { accountClaimed });
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

  if (!(await userDocumentExists(email))) {
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

// TODO: Rework into login function
// export const verifyAdminUserPassword: LambdaEventWithResult<
//   typeof adminUserVerifyPasswordInput
// > = async ({ body: { email, password } }) => {
//   const adminUser = await fetchUserByEmail(email);

//   if (!adminUser) {
//     return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER);
//   }

//   if (!!adminUser.passwordHash || !!adminUser.passwordSalt) {
//     return formatJSONErrorResponse(400, ErrorCodes.ACCOUNT_UNCLAIMED);
//   }
//   const Plaintext = stringToUint8Array(password + adminUser.passwordSalt);

//   const encrypt = new EncryptCommand({
//     KeyId: ADMIN_USER_PASSWORD_KEY_ALIAS,
//     Plaintext,
//   });

//   const { CiphertextBlob } = await kmsClient.send(encrypt);

//   if (!CiphertextBlob)
//     return formatJSONErrorResponse(502, ErrorCodes.ENCRYPTION_FAILED);

//   const encryptedPassword = Uint8ArrayToStr(CiphertextBlob);

//   const passwordVerified = encryptedPassword === adminUser.passwordHash;

//   return formatJSONResponse(200, { passwordVerified });
// };

export const handleCheckAdminUserExists = middyfy(checkAdminUserExists);

export const handleCheckAdminUserAccountIsClaimed = middyfy(
  checkAdminUserAccountIsClaimed
);

export const handleSetAdminUserPassword = middyfy(setAdminUserPassword);

// export const handleVerifyAdminUserPassword = middyfy(verifyAdminUserPassword);
