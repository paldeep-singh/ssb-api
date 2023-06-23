import { faker } from '@faker-js/faker'
import {
  deleteTestVerificationCode,
  fetchTestVerificationCode
} from '../fixtures'
import * as dynamoDB from '../../models/verificationCodes'
import * as ErrorCodes from '../../misc'
import { expectError } from '@libs/testUtils'
import dayjs from 'dayjs'

const email = faker.internet.email()
const userId = faker.datatype.uuid()

describe('putVerificationCode', () => {
  const userId = faker.datatype.uuid()
  const codeHash = faker.datatype.string(30)

  afterEach(async () => {
    await deleteTestVerificationCode(userId)
  })

  it('creates a verification code', async () => {
    await dynamoDB.putVerificationCode({
      userId,
      codeHash
    })

    const response = await fetchTestVerificationCode(userId)

    expect(response).toEqual(
      expect.objectContaining({
        userId,
        codeHash
      })
    )
  })

  it('sets ttl to 5 minutes from now', async () => {
    const now = dayjs()
    const fiveMinutesFromNow = now.add(5, 'minutes').startOf('second')
    const sixMinutesFromNow = now.add(6, 'minutes')

    await dynamoDB.putVerificationCode({
      userId,
      codeHash
    })

    const response = await fetchTestVerificationCode(userId)

    const ttlDate = dayjs(response.ttl)

    expect(ttlDate.valueOf()).toBeGreaterThanOrEqual(
      fiveMinutesFromNow.valueOf()
    )
    expect(ttlDate.valueOf()).toBeLessThan(sixMinutesFromNow.valueOf())
  })
})

describe('fetchVerificationCode', () => {
  describe('when a verification code for the user exists', () => {
    const userId = faker.datatype.uuid()
    const codeHash = faker.datatype.string(30)

    beforeEach(async () => {
      await dynamoDB.putVerificationCode({
        userId,
        codeHash
      })
    })

    afterEach(async () => {
      await deleteTestVerificationCode(email)
    })

    it('returns the verification code', async () => {
      const response = await dynamoDB.fetchVerificationCode(userId)

      expect(response).toEqual(
        expect.objectContaining({
          userId,
          codeHash
        })
      )
    })
  })

  describe('when a verification code for the user does not exist', () => {
    it(`returns undefined`, async () => {
      expect.assertions(1)
      try {
        await dynamoDB.fetchVerificationCode(userId)
      } catch (error) {
        expectError(error, ErrorCodes.ErrorCodes.NO_ACTIVE_VERIFICATION_CODE)
      }
    })
  })
})

describe('deleteVerificationCode', () => {
  const userId = faker.datatype.uuid()
  const codeHash = faker.datatype.string(30)

  describe('if a verification code exists', () => {
    beforeEach(async () => {
      await dynamoDB.putVerificationCode({
        userId,
        codeHash
      })
    })

    it('deletes the verification code', async () => {
      await dynamoDB.deleteVerificationCode(email)

      const response = await fetchTestVerificationCode(email)

      expect(response).toEqual(undefined)
    })
  })

  describe('if no verification code exists', () => {
    it('does not throw an error', async () => {
      await dynamoDB.deleteVerificationCode(email)
    })
  })
})
