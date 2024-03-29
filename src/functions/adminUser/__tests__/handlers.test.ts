import {
  handleCheckAdminUserAccountIsClaimed,
  handleSetAdminUserPassword,
  handleSendAdminUserVerificationCode,
  handleVerifyAdminUserEmail,
  handleLogin,
  handleGetAdminUserDetails
} from '../handlers'
import { faker } from '@faker-js/faker'
import {
  createAPIGatewayProxyEvent,
  createAPIGatewayProxyEventContext,
  createAPIGatewayProxyEventWithAuthorisationHeader
} from '@libs/fixtures'
import {
  putVerificationCode,
  fetchVerificationCode,
  deleteVerificationCode
} from '../models/verificationCodes'
import { ErrorCodes } from '../misc'
import { mocked } from 'jest-mock'
import {
  createAdminUser,
  createSession,
  createVerificationCode
} from './fixtures'
import { mockClient } from 'aws-sdk-client-mock'
import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses'
import dayjs from 'dayjs'
import {
  fetchUserByEmail,
  updatePassword,
  fetchUser
} from '../models/adminUsers'
import bcrypt from 'bcryptjs'
import { createNewSession, fetchSession } from '../models/sessions'

const mockedSESCLient = mockClient(SESClient)

jest.mock('../models/verificationCodes')
jest.mock('../models/adminUsers')
jest.mock('../models/sessions')
jest.mock('bcryptjs')

beforeEach(() => {
  jest.clearAllMocks()
})

const email = faker.internet.email()
const context = createAPIGatewayProxyEventContext()

describe('handleCheckAdminUserAccountIsClaimed', () => {
  const APIGatewayEvent = createAPIGatewayProxyEvent({
    email
  })
  describe.each([
    [
      'set',
      true,
      createAdminUser({
        passwordHash: faker.datatype.string(20)
      })
    ],
    [
      'not set',
      false,
      createAdminUser({
        passwordHash: ''
      })
    ]
  ])(
    "when the user's password is %s",
    (_, expectedAccountClaimed, adminUser) => {
      beforeEach(() => {
        mocked(fetchUserByEmail).mockResolvedValueOnce(adminUser)
      })

      it(`returns statusCode 200`, async () => {
        const { statusCode } = await handleCheckAdminUserAccountIsClaimed(
          APIGatewayEvent,
          context,
          jest.fn()
        )

        expect(statusCode).toEqual(200)
      })

      it(`"returns accountIsClaimed ${expectedAccountClaimed}"`, async () => {
        const { body } = await handleCheckAdminUserAccountIsClaimed(
          APIGatewayEvent,
          context,
          jest.fn()
        )

        expect(JSON.parse(body).accountClaimed).toEqual(expectedAccountClaimed)
      })
    }
  )

  describe('when the user does not exist', () => {
    beforeEach(() => {
      mocked(fetchUserByEmail).mockRejectedValueOnce(
        new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
      )
    })

    it('returns statusCode 404', async () => {
      const { statusCode } = await handleCheckAdminUserAccountIsClaimed(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(statusCode).toEqual(404)
    })

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleCheckAdminUserAccountIsClaimed(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(JSON.parse(body).message).toEqual(
        ErrorCodes.NON_EXISTENT_ADMIN_USER
      )
    })
  })
})

describe('handleSetAdminUserPassword', () => {
  describe('when the session is invalid', () => {
    const sessionId = faker.datatype.uuid()
    const APIGatewayEvent = createAPIGatewayProxyEventWithAuthorisationHeader(
      {
        newPassword: faker.internet.password(),
        confirmNewPassword: faker.internet.password()
      },
      sessionId
    )

    beforeEach(() => {
      mocked(fetchSession).mockResolvedValueOnce(null)
    })

    it('returns statusCode 401', async () => {
      const { statusCode } = await handleSetAdminUserPassword(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(statusCode).toEqual(401)
    })

    it(`returns ${ErrorCodes.INVALID_SESSION} error message`, async () => {
      const { body } = await handleSetAdminUserPassword(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(JSON.parse(body).message).toEqual(ErrorCodes.INVALID_SESSION)
    })
  })

  describe('when the session is valid', () => {
    const sessionId = faker.datatype.uuid()
    const userId = faker.datatype.uuid()

    beforeEach(() => {
      mocked(fetchSession).mockResolvedValueOnce({
        id: sessionId,
        data: {
          userId
        }
      })
    })

    describe('when the password is valid', () => {
      const password = faker.random.alphaNumeric(5) + 'Aa1'

      const encryptedPassword = faker.datatype.string(20)

      const APIGatewayEvent = createAPIGatewayProxyEventWithAuthorisationHeader(
        {
          newPassword: password,
          confirmNewPassword: password
        },
        sessionId
      )

      beforeEach(() => {
        mocked(bcrypt.hash).mockResolvedValueOnce(encryptedPassword as never)
      })

      it('returns statusCode 200', async () => {
        const { statusCode } = await handleSetAdminUserPassword(
          APIGatewayEvent,
          context,
          jest.fn()
        )

        expect(statusCode).toEqual(200)
      })

      it('calls setPassword with the correct arguments', async () => {
        await handleSetAdminUserPassword(APIGatewayEvent, context, jest.fn())

        expect(updatePassword).toHaveBeenCalledWith({
          userId,
          newPasswordHash: encryptedPassword
        })
      })
    })

    describe('when the password is invalid', () => {
      describe.each([
        ['is too short', faker.random.alphaNumeric(4) + 'Aa1'],
        ['has no uppercase letters', faker.random.alphaNumeric(6) + 'a1'],
        [
          'has no lowercase letters',
          faker.random.alphaNumeric(6, { casing: 'upper' }) + 'A1'
        ],
        ['has no numbers', faker.random.alpha(6)]
      ])(`when the password %s`, (_, password) => {
        const APIGatewayEvent =
          createAPIGatewayProxyEventWithAuthorisationHeader(
            {
              email,
              newPassword: password,
              confirmNewPassword: password
            },
            faker.datatype.uuid()
          )

        it('returns statusCode 400', async () => {
          const { statusCode } = await handleSetAdminUserPassword(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(statusCode).toEqual(400)
        })

        it(`returns ${ErrorCodes.INVALID_PASSWORD} error message`, async () => {
          const { body } = await handleSetAdminUserPassword(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(JSON.parse(body).message).toEqual(ErrorCodes.INVALID_PASSWORD)
        })
      })
    })

    describe('when the passwords do not match', () => {
      const APIGatewayEvent = createAPIGatewayProxyEventWithAuthorisationHeader(
        {
          newPassword: faker.internet.password(),
          confirmNewPassword: faker.internet.password()
        },
        sessionId
      )

      it('returns statusCode 400', async () => {
        const { statusCode } = await handleSetAdminUserPassword(
          APIGatewayEvent,
          context,
          jest.fn()
        )

        expect(statusCode).toEqual(400)
      })

      it(`returns ${ErrorCodes.PASSWORD_MISMATCH} error message`, async () => {
        const { body } = await handleSetAdminUserPassword(
          APIGatewayEvent,
          context,
          jest.fn()
        )

        expect(JSON.parse(body).message).toEqual(ErrorCodes.PASSWORD_MISMATCH)
      })
    })
  })
})

describe('handleSendAdminUserVerificationCode', () => {
  const email = faker.internet.email()

  const APIGatewayEvent = createAPIGatewayProxyEvent({
    email
  })

  describe('when the user does not exist', () => {
    beforeEach(() => {
      mocked(fetchUserByEmail).mockRejectedValueOnce(
        new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
      )
    })

    it('returns statusCode 404', async () => {
      const { statusCode } = await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(statusCode).toEqual(404)
    })

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(JSON.parse(body).message).toEqual(
        ErrorCodes.NON_EXISTENT_ADMIN_USER
      )
    })
  })

  describe('when the user exists', () => {
    const verificationCode = faker.random.alphaNumeric(6).toUpperCase()
    const codeHash = faker.datatype.string(20)
    const userId = faker.datatype.uuid()

    const adminUser = createAdminUser({
      email,
      userId
    })

    beforeEach(() => {
      mocked(fetchUserByEmail).mockResolvedValue(adminUser)

      mocked(bcrypt.hash).mockResolvedValueOnce(codeHash as never)
    })

    it('deletes any existing codes', async () => {
      await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(mocked(deleteVerificationCode)).toHaveBeenCalledWith(userId)
    })

    it('returns statusCode 200', async () => {
      const { statusCode } = await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(statusCode).toEqual(200)
    })

    it('inserts the verification code into the table', async () => {
      await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(mocked(putVerificationCode)).toHaveBeenCalledWith({
        userId,
        codeHash
      })
    })

    it("sends the verification code to the user's email", async () => {
      await handleSendAdminUserVerificationCode(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      mockedSESCLient.calls()[0].calledWithExactly(
        new SendEmailCommand({
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
      )
    })
  })
})

describe('handleVerifyAdminUserEmail', () => {
  const email = faker.internet.email()
  const verificationCode = faker.random.alphaNumeric(6).toUpperCase()

  const APIGatewayEvent = createAPIGatewayProxyEvent({
    email,
    verificationCode
  })

  describe('when the user does not exist', () => {
    beforeEach(() => {
      mocked(fetchUserByEmail).mockRejectedValueOnce(
        new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
      )
    })

    it('returns statusCode 404', async () => {
      const { statusCode } = await handleVerifyAdminUserEmail(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(statusCode).toEqual(404)
    })

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleVerifyAdminUserEmail(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(JSON.parse(body).message).toEqual(
        ErrorCodes.NON_EXISTENT_ADMIN_USER
      )
    })
  })

  describe('when the user exists', () => {
    const userId = faker.datatype.uuid()

    const adminUser = createAdminUser({
      email,
      userId
    })

    beforeEach(() => {
      mocked(fetchUserByEmail).mockResolvedValue(adminUser)
    })

    describe('when no verification code exists for the user', () => {
      beforeEach(() => {
        mocked(fetchVerificationCode).mockRejectedValueOnce(
          new Error(ErrorCodes.NO_ACTIVE_VERIFICATION_CODE)
        )
      })

      it('returns statusCode 404', async () => {
        const { statusCode } = await handleVerifyAdminUserEmail(
          APIGatewayEvent,
          context,
          jest.fn()
        )

        expect(statusCode).toEqual(404)
      })

      it(`returns ${ErrorCodes.NO_ACTIVE_VERIFICATION_CODE} error message`, async () => {
        const { body } = await handleVerifyAdminUserEmail(
          APIGatewayEvent,
          context,
          jest.fn()
        )

        expect(JSON.parse(body).message).toEqual(
          ErrorCodes.NO_ACTIVE_VERIFICATION_CODE
        )
      })
    })

    describe('when a verification code exists for the user', () => {
      const expiredCode = createVerificationCode({
        userId,
        ttl: new Date().toISOString()
      })
      describe('when the verification code is expired', () => {
        beforeEach(() => {
          mocked(fetchVerificationCode).mockResolvedValueOnce(expiredCode)
        })

        it('returns statusCode 400', async () => {
          const { statusCode } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(statusCode).toEqual(400)
        })

        it(`returns ${ErrorCodes.VERIFICATION_CODE_EXPIRED} error message`, async () => {
          const { body } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(JSON.parse(body).message).toEqual(
            ErrorCodes.VERIFICATION_CODE_EXPIRED
          )
        })
      })
    })

    describe('when the verification code has not expired', () => {
      const codeHash = faker.datatype.string(20)
      const storedCode = createVerificationCode({
        userId,
        ttl: dayjs().add(5, 'minute').toISOString(),
        codeHash
      })

      beforeEach(() => {
        mocked(fetchVerificationCode).mockResolvedValueOnce(storedCode)
      })

      describe('if the verification code does not match', () => {
        beforeEach(() => {
          mocked(bcrypt.compare).mockResolvedValueOnce(false as never)
        })

        it('returns statusCode 400', async () => {
          const { statusCode } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(statusCode).toEqual(400)
        })

        it(`returns ${ErrorCodes.INVALID_VERIFICATION_CODE} error message`, async () => {
          const { body } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(JSON.parse(body).message).toEqual(
            ErrorCodes.INVALID_VERIFICATION_CODE
          )
        })

        it('does not delete the verification code', async () => {
          await handleVerifyAdminUserEmail(APIGatewayEvent, context, jest.fn())

          expect(mocked(deleteVerificationCode)).not.toHaveBeenCalled()
        })
      })

      describe('if the verification code matches"', () => {
        const sessionId = faker.datatype.uuid()

        beforeEach(() => {
          mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
          mocked(createNewSession).mockResolvedValueOnce({
            id: sessionId,
            data: {
              userId
            }
          })
        })

        it('returns statusCode 200', async () => {
          const { statusCode } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(statusCode).toEqual(200)
        })

        it('returns a session', async () => {
          const { body } = await handleVerifyAdminUserEmail(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(JSON.parse(body)).toEqual({
            id: sessionId,
            data: {
              userId
            }
          })
        })

        it('deletes the verification code', async () => {
          await handleVerifyAdminUserEmail(APIGatewayEvent, context, jest.fn())

          expect(mocked(deleteVerificationCode)).toHaveBeenCalledWith(userId)
        })
      })
    })
  })
})

describe('handleLogin', () => {
  const email = faker.internet.email()
  const password = faker.internet.password()

  const APIGatewayEvent = createAPIGatewayProxyEvent({
    email,
    password
  })

  describe('when the user does not exist', () => {
    beforeEach(() => {
      mocked(fetchUserByEmail).mockRejectedValueOnce(
        new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
      )
    })

    it('returns statusCode 404', async () => {
      const { statusCode } = await handleLogin(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(statusCode).toEqual(404)
    })

    it(`returns ${ErrorCodes.NON_EXISTENT_ADMIN_USER} error message`, async () => {
      const { body } = await handleLogin(APIGatewayEvent, context, jest.fn())

      expect(JSON.parse(body).message).toEqual(
        ErrorCodes.NON_EXISTENT_ADMIN_USER
      )
    })
  })

  describe('when the user exists"', () => {
    describe("when the user's password has not been set", () => {
      const adminUser = createAdminUser({
        email,
        passwordHash: undefined
      })
      beforeEach(() => {
        mocked(fetchUserByEmail).mockResolvedValueOnce(adminUser)
      })

      it('returns statusCode 400', async () => {
        const { statusCode } = await handleLogin(
          APIGatewayEvent,
          context,
          jest.fn()
        )

        expect(statusCode).toEqual(400)
      })

      it(`returns ${ErrorCodes.ACCOUNT_UNCLAIMED} error message`, async () => {
        const { body } = await handleLogin(APIGatewayEvent, context, jest.fn())

        expect(JSON.parse(body).message).toEqual(ErrorCodes.ACCOUNT_UNCLAIMED)
      })
    })

    describe("when the user's password has been set", () => {
      describe('when the password does not match"', () => {
        const adminUser = createAdminUser({
          email,
          passwordHash: faker.datatype.string(20)
        })
        beforeEach(() => {
          mocked(fetchUserByEmail).mockResolvedValueOnce(adminUser)
          mocked(bcrypt.compare).mockResolvedValueOnce(false as never)
        })

        it('returns statusCode 400', async () => {
          const { statusCode } = await handleLogin(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(statusCode).toEqual(400)
        })

        it(`returns ${ErrorCodes.INVALID_PASSWORD} error message`, async () => {
          const { body } = await handleLogin(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(JSON.parse(body).message).toEqual(ErrorCodes.INVALID_PASSWORD)
        })
      })

      describe('when the password matches"', () => {
        const adminUser = createAdminUser({
          email,
          passwordHash: faker.datatype.string(20)
        })
        const sessionId = faker.datatype.uuid()

        beforeEach(() => {
          mocked(fetchUserByEmail).mockResolvedValueOnce(adminUser)
          mocked(bcrypt.compare).mockResolvedValueOnce(true as never)
          mocked(createNewSession).mockResolvedValueOnce({
            id: sessionId,
            data: {
              userId: adminUser.userId
            }
          })
        })

        it('returns statusCode 200', async () => {
          const { statusCode } = await handleLogin(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(statusCode).toEqual(200)
        })

        it('returns a session', async () => {
          const { body } = await handleLogin(
            APIGatewayEvent,
            context,
            jest.fn()
          )

          expect(JSON.parse(body)).toEqual({
            id: sessionId,
            data: {
              userId: adminUser.userId
            }
          })
        })
      })
    })
  })
})

describe('handleGetAdminUserDetails', () => {
  const userId = faker.datatype.uuid()
  const adminUser = createAdminUser({
    userId
  })
  const sessionId = faker.datatype.uuid()

  const APIGatewayEvent = createAPIGatewayProxyEventWithAuthorisationHeader(
    {},
    sessionId
  )

  describe('when the session does not exist', () => {
    beforeEach(() => {
      mocked(fetchSession).mockResolvedValueOnce(null)
    })

    it('returns statusCode 401', async () => {
      const { statusCode } = await handleGetAdminUserDetails(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(statusCode).toEqual(401)
    })

    it(`returns ${ErrorCodes.INVALID_SESSION} error message`, async () => {
      const { body } = await handleGetAdminUserDetails(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(JSON.parse(body).message).toEqual(ErrorCodes.INVALID_SESSION)
    })
  })

  describe('when the session exists', () => {
    const session = createSession(sessionId, userId)
    beforeEach(() => {
      mocked(fetchSession).mockResolvedValueOnce(session)

      mocked(fetchUser).mockResolvedValueOnce(adminUser)
    })

    it('returns statusCode 200', async () => {
      const { statusCode } = await handleGetAdminUserDetails(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(statusCode).toEqual(200)
    })

    it('returns the admin user details', async () => {
      const { body } = await handleGetAdminUserDetails(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(JSON.parse(body)).toEqual({ name: adminUser.name })
    })
  })
})
