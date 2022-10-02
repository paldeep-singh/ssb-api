import {
  putVerificationCode,
  fetchVerificationCode,
  deleteVerificationCode,
} from "./models/verificationCodes";
import { ErrorCodes } from "./misc";
import {
  LambdaEventWithResult,
  formatJSONResponse,
  formatJSONErrorResponse,
} from "@libs/api-gateway";
import {
  adminUserEmailInput,
  adminUserSetPasswordInput,
  adminUserVerifyEmailInput,
} from "./schema";
import { middyfy } from "@libs/lambda";
import { isError } from "@libs/utils";
import { randomBytes } from "crypto";
import { kmsClient, stringToUint8Array, Uint8ArrayToStr } from "@libs/kms";
import { ADMIN_USER_PASSWORD_KEY_ALIAS } from "./resources";
import { EncryptCommand } from "@aws-sdk/client-kms";
import { sesClient } from "@libs/ses";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import {
  userDocumentExists,
  fetchUserByEmail,
  setPassword,
} from "./models/adminUsers";
import bcrypt from "bcryptjs";

export const passwordValidationRegex =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/;

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

  // Password must contain one number, one lowercase letter, one uppercase letter,
  // and be at least 8 characters long
  if (!passwordValidationRegex.test(newPassword)) {
    return formatJSONErrorResponse(400, ErrorCodes.INVALID_PASSWORD);
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

export const sendAdminUserVerificationCode: LambdaEventWithResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body;

  try {
    const { userId } = await fetchUserByEmail(email);

    const verificationCode = randomBytes(3).toString("hex").toUpperCase();

    const codeHash = await bcrypt.hash(verificationCode, 10);

    // delete any existing verification code
    await deleteVerificationCode(userId);

    await putVerificationCode({ userId, codeHash });

    const sendEmail = new SendEmailCommand({
      Destination: {
        ToAddresses: [email],
      },
      Message: {
        Subject: {
          Data: "Spice Spice Baby Verification Code",
        },
        Body: {
          Text: {
            Data: `Your verification code is: ${verificationCode}`,
          },
        },
      },
      Source: "spicespicebaby01@gmail.com",
    });

    await sesClient.send(sendEmail);

    return formatJSONResponse(200, {});
  } catch (error) {
    if (!isError(error)) throw error;

    if (error.message === ErrorCodes.NON_EXISTENT_ADMIN_USER)
      return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER);

    throw error;
  }
};

const verifyAdminUserEmail: LambdaEventWithResult<
  typeof adminUserVerifyEmailInput
> = async (event) => {
  const { email, verificationCode: providedCode } = event.body;

  try {
    const { userId } = await fetchUserByEmail(email);

    const { codeHash, ttl } = await fetchVerificationCode(userId);

    const now = new Date().getTime();
    const codeExpiry = new Date(ttl).getTime();

    if (now > codeExpiry) {
      await deleteVerificationCode(userId);
      return formatJSONErrorResponse(400, ErrorCodes.VERIFICATION_CODE_EXPIRED);
    }

    const codeMatch = await bcrypt.compare(providedCode, codeHash);

    if (!codeMatch) {
      return formatJSONErrorResponse(400, ErrorCodes.INVALID_VERIFICATION_CODE);
    }

    await deleteVerificationCode(userId);

    return formatJSONResponse(200, {});
  } catch (error) {
    if (!isError(error)) throw error;

    if (error.message === ErrorCodes.NON_EXISTENT_ADMIN_USER)
      return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER);

    if (error.message === ErrorCodes.NO_ACTIVE_VERIFICATION_CODE)
      return formatJSONErrorResponse(
        404,
        ErrorCodes.NO_ACTIVE_VERIFICATION_CODE
      );

    throw error;
  }
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

export const handleSendAdminUserVerificationCode = middyfy(
  sendAdminUserVerificationCode
);

export const handleVerifyAdminUserEmail = middyfy(verifyAdminUserEmail);

// export const handleVerifyAdminUserPassword = middyfy(verifyAdminUserPassword);
