import {
  putVerificationCode,
  fetchVerificationCode,
  deleteVerificationCode
} from './models/verificationCodes'
import { ErrorCodes } from './misc'
import {
  LambdaEventWithSchemaAndResult,
  formatJSONResponse,
  formatJSONErrorResponse,
  bodyParser,
  LambdaEventWithSchemaAndAuthorisationHeaderAndResult,
  bodyParserWithAuthorisationHeader,
  IEmptyInputType
} from '@libs/api-gateway'
import {
  adminUserEmailInput,
  adminUserLoginInput,
  adminUserSetPasswordInput,
  adminUserVerifyEmailInput
} from './schema'
import { isError } from '@libs/utils'
import { randomBytes } from 'crypto'
import { sesClient } from '@libs/ses'
import { SendEmailCommand } from '@aws-sdk/client-ses'
import {
  fetchUser,
  fetchUserByEmail,
  updatePassword
} from './models/adminUsers'
import bcrypt from 'bcryptjs'
import { createNewSession, fetchSession } from './models/sessions'

export const passwordValidationRegex =
  /^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9]).{8,}$/

const checkAccountIsClaimed: LambdaEventWithSchemaAndResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body
  try {
    const user = await fetchUserByEmail(email)

    const accountClaimed = !!user.passwordHash

    return formatJSONResponse(200, { accountClaimed })
  } catch (error) {
    if (!isError(error)) throw error

    if (error.message === ErrorCodes.NON_EXISTENT_ADMIN_USER) {
      return formatJSONErrorResponse(404, error.message)
    }

    throw error
  }
}

const setPassword: LambdaEventWithSchemaAndAuthorisationHeaderAndResult<
  typeof adminUserSetPasswordInput
> = async (event) => {
  const { newPassword, confirmNewPassword } = event.body
  const { Authorization: sessionId } = event.headers

  const session = await fetchSession(sessionId)

  if (!session) return formatJSONErrorResponse(401, ErrorCodes.INVALID_SESSION)

  if (newPassword !== confirmNewPassword) {
    return formatJSONErrorResponse(400, ErrorCodes.PASSWORD_MISMATCH)
  }

  // Password must contain one number, one lowercase letter, one uppercase letter,
  // and be at least 8 characters long
  if (!passwordValidationRegex.test(newPassword)) {
    return formatJSONErrorResponse(400, ErrorCodes.INVALID_PASSWORD)
  }

  const newPasswordHash = await bcrypt.hash(newPassword, 10)

  await updatePassword({ userId: session.data.userId, newPasswordHash })
  return formatJSONResponse(200)
}

const sendVerificationCode: LambdaEventWithSchemaAndResult<
  typeof adminUserEmailInput
> = async (event) => {
  const { email } = event.body

  try {
    const { userId } = await fetchUserByEmail(email)

    const verificationCode = randomBytes(3).toString('hex').toUpperCase()

    const codeHash = await bcrypt.hash(verificationCode, 10)

    // delete any existing verification code
    await deleteVerificationCode(userId)

    await putVerificationCode({ userId, codeHash })

    const sendEmail = new SendEmailCommand({
      Destination: {
        ToAddresses: [email]
      },
      Message: {
        Subject: {
          Data: 'Spice Spice Baby Verification Code'
        },
        Body: {
          Text: {
            Data: `Your verification code is: ${verificationCode}`
          }
        }
      },
      Source: 'spicespicebaby01@gmail.com'
    })

    await sesClient.send(sendEmail)

    return formatJSONResponse(200, {})
  } catch (error) {
    if (!isError(error)) throw error

    if (error.message === ErrorCodes.NON_EXISTENT_ADMIN_USER)
      return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER)

    throw error
  }
}

const verifyEmail: LambdaEventWithSchemaAndResult<
  typeof adminUserVerifyEmailInput
> = async (event) => {
  const { email, verificationCode: providedCode } = event.body

  try {
    const { userId } = await fetchUserByEmail(email)

    const { codeHash, ttl } = await fetchVerificationCode(userId)

    const now = new Date().getTime()
    const codeExpiry = new Date(ttl).getTime()

    if (now > codeExpiry) {
      await deleteVerificationCode(userId)
      return formatJSONErrorResponse(400, ErrorCodes.VERIFICATION_CODE_EXPIRED)
    }

    const codeMatch = await bcrypt.compare(providedCode, codeHash)

    if (!codeMatch) {
      return formatJSONErrorResponse(400, ErrorCodes.INVALID_VERIFICATION_CODE)
    }

    await deleteVerificationCode(userId)

    const session = await createNewSession(userId, true)

    return formatJSONResponse(200, { ...session })
  } catch (error) {
    if (!isError(error)) throw error

    if (error.message === ErrorCodes.NON_EXISTENT_ADMIN_USER)
      return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER)

    if (error.message === ErrorCodes.NO_ACTIVE_VERIFICATION_CODE)
      return formatJSONErrorResponse(
        404,
        ErrorCodes.NO_ACTIVE_VERIFICATION_CODE
      )

    throw error
  }
}

const login: LambdaEventWithSchemaAndResult<
  typeof adminUserLoginInput
> = async ({ body: { email, password } }) => {
  try {
    const adminUser = await fetchUserByEmail(email)

    if (!adminUser.passwordHash) {
      return formatJSONErrorResponse(400, ErrorCodes.ACCOUNT_UNCLAIMED)
    }

    const { passwordHash, userId } = adminUser

    const passwordMatch = await bcrypt.compare(password, passwordHash)

    if (!passwordMatch) {
      return formatJSONErrorResponse(400, ErrorCodes.INVALID_PASSWORD)
    }

    const session = await createNewSession(userId)

    return formatJSONResponse(200, { ...session })
  } catch (error) {
    if (!isError(error)) throw error

    if (error.message === ErrorCodes.NON_EXISTENT_ADMIN_USER)
      return formatJSONErrorResponse(404, ErrorCodes.NON_EXISTENT_ADMIN_USER)

    throw error
  }
}

const getUserDetails: LambdaEventWithSchemaAndAuthorisationHeaderAndResult =
  async (event) => {
    const { Authorization: sessionId } = event.headers

    const session = await fetchSession(sessionId)

    if (!session)
      return formatJSONErrorResponse(401, ErrorCodes.INVALID_SESSION)

    const { name } = await fetchUser(session.data.userId)

    return formatJSONResponse(200, { name })
  }

export const handleCheckAdminUserAccountIsClaimed = bodyParser<
  typeof adminUserEmailInput
>(checkAccountIsClaimed)

export const handleSetAdminUserPassword =
  bodyParserWithAuthorisationHeader<typeof adminUserSetPasswordInput>(
    setPassword
  )

export const handleSendAdminUserVerificationCode =
  bodyParser<typeof adminUserEmailInput>(sendVerificationCode)

export const handleVerifyAdminUserEmail =
  bodyParser<typeof adminUserVerifyEmailInput>(verifyEmail)

export const handleLogin = bodyParser<typeof adminUserLoginInput>(login)

export const handleGetAdminUserDetails =
  bodyParserWithAuthorisationHeader<IEmptyInputType>(getUserDetails)
