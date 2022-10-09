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
  adminUserLoginInput,
  adminUserSetPasswordInput,
  adminUserVerifyEmailInput,
} from "./schema";
import { middyfy } from "@libs/lambda";
import { isError } from "@libs/utils";
import { randomBytes } from "crypto";
import { sesClient } from "@libs/ses";
import { SendEmailCommand } from "@aws-sdk/client-ses";
import {
  userDocumentExists,
  fetchUserByEmail,
  updatePassword,
} from "./models/adminUsers";
import bcrypt from "bcryptjs";
import { createNewSession } from "./models/sessions";

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

const checkAccountIsClaimed: LambdaEventWithResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body;
  try {
    const user = await fetchUserByEmail(email);

    const accountClaimed = !!user.passwordHash;

    return formatJSONResponse(200, { accountClaimed });
  } catch (error) {
    if (!isError(error)) throw error;

    if (error.message === ErrorCodes.NON_EXISTENT_ADMIN_USER) {
      return formatJSONErrorResponse(404, error.message);
    }

    throw error;
  }
};

const setPassword: LambdaEventWithResult<
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

  const newPasswordHash = await bcrypt.hash(newPassword, 10);

  await updatePassword({ email, newPasswordHash });
  return formatJSONResponse(200, { passwordSet: true });
};

export const sendVerificationCode: LambdaEventWithResult<
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

const verifyEmail: LambdaEventWithResult<
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

    const session = await createNewSession(userId);

    return formatJSONResponse(200, { ...session });
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

export const login: LambdaEventWithResult<typeof adminUserLoginInput> = async ({
  body: { email, password },
}) => {
  const adminUser = await fetchUserByEmail(email);

  if (!adminUser) {
    return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER);
  }

  if (!adminUser.passwordHash) {
    return formatJSONErrorResponse(400, ErrorCodes.ACCOUNT_UNCLAIMED);
  }

  const { passwordHash, userId } = adminUser;

  const passwordMatch = await bcrypt.compare(password, passwordHash);

  if (!passwordMatch) {
    return formatJSONErrorResponse(400, ErrorCodes.INVALID_PASSWORD);
  }

  const sessionId = await createNewSession(userId);

  return formatJSONResponse(200, { sessionId });
};

export const handleCheckAdminUserExists = middyfy(checkAdminUserExists);

export const handleCheckAdminUserAccountIsClaimed = middyfy(
  checkAccountIsClaimed
);

export const handleSetAdminUserPassword = middyfy(setPassword);

export const handleSendAdminUserVerificationCode =
  middyfy(sendVerificationCode);

export const handleVerifyAdminUserEmail = middyfy(verifyEmail);

// export const handleVerifyAdminUserPassword = middyfy(verifyAdminUserPassword);
