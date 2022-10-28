import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { faker } from '@faker-js/faker'
import {
  createAPIGatewayProxyEvent,
  createAPIGatewayProxyEventContext
} from '@libs/fixtures'
import { mockClient } from 'aws-sdk-client-mock'
import { specificAdminUserAuthoriserFunction } from '../authorisers'
import nock from 'nock'
import { fetchUser } from '../models/adminUsers'
import { mocked } from 'jest-mock'

const ssmMock = mockClient(SSMClient)
const redisURL = faker.internet.url()
const redisToken = faker.datatype.uuid()
const redisScope = nock(redisURL)
jest.mock('../models/adminUsers')

beforeEach(() => {
  ssmMock.reset()
})

const expectUnauthorised = (result: unknown) => {
  expect(result).toEqual({
    isAuthorized: false
  })
}

const expectAuthorised = (result: unknown) => {
  expect(result).toEqual({
    isAuthorized: true
  })
}

describe('specificAdminUserAuthoriser', () => {
  const sessionId = faker.datatype.uuid()
  const headers = {
    Authorization: sessionId
  }
  const context = createAPIGatewayProxyEventContext()

  describe('when the Authroization header is not present', () => {
    const event = createAPIGatewayProxyEvent()

    it('returns an unauthorised response', async () => {
      const result = await specificAdminUserAuthoriserFunction(
        event,
        context,
        jest.fn()
      )

      expectUnauthorised(result)
    })
  })

  describe('when the authorisation header is present', () => {
    describe('when the body is not an object', () => {
      const event = createAPIGatewayProxyEvent(
        {
          body: 'not an object'
        },
        {},
        headers
      )

      it('returns an unauthorised response', async () => {
        const result = await specificAdminUserAuthoriserFunction(
          event,
          context,
          jest.fn()
        )

        expectUnauthorised(result)
      })
    })
  })

  describe('when the body is an object', () => {
    describe('when the body does not contain an email or userId', () => {
      const event = createAPIGatewayProxyEvent({}, {}, headers)

      it('returns an unauthorised response', async () => {
        const result = await specificAdminUserAuthoriserFunction(
          event,
          context,
          jest.fn()
        )

        expectUnauthorised(result)
      })
    })

    describe('when the body contains a userId', () => {
      const userId = faker.datatype.uuid()
      const sessionData = JSON.stringify({
        userId
      })

      beforeEach(() => {
        ssmMock
          .on(GetParameterCommand)
          .resolvesOnce({
            Parameter: {
              Value: redisURL
            }
          })
          .resolvesOnce({
            Parameter: {
              Value: redisToken
            }
          })

        redisScope
          .get(`/get/${sessionId}`)
          .matchHeader('Authorization', `Bearer ${redisToken}`)
          .reply(200, {
            result: sessionData
          })
      })

      describe('when the userId does not match the session userId', () => {
        const event = createAPIGatewayProxyEvent(
          {
            userId: faker.datatype.uuid()
          },
          {},
          headers
        )

        it('returns an unauthorised response', async () => {
          const result = await specificAdminUserAuthoriserFunction(
            event,
            context,
            jest.fn()
          )

          expectUnauthorised(result)
        })
      })

      describe('when the userId matches the session userId', () => {
        const event = createAPIGatewayProxyEvent(
          {
            userId
          },
          {},
          headers
        )

        it('returns an authorised response', async () => {
          const result = await specificAdminUserAuthoriserFunction(
            event,
            context,
            jest.fn()
          )

          expectAuthorised(result)
        })
      })
    })

    describe('when the body contains an email', () => {
      const userId = faker.datatype.uuid()
      const sessionData = JSON.stringify({
        userId
      })

      beforeEach(() => {
        ssmMock
          .on(GetParameterCommand)
          .resolvesOnce({
            Parameter: {
              Value: redisURL
            }
          })
          .resolvesOnce({
            Parameter: {
              Value: redisToken
            }
          })

        redisScope
          .get(`/get/${sessionId}`)
          .matchHeader('Authorization', `Bearer ${redisToken}`)
          .reply(200, {
            result: sessionData
          })
      })

      describe("when the email does not match the session user's email", () => {
        const event = createAPIGatewayProxyEvent(
          {
            email: faker.internet.email()
          },
          {},
          headers
        )

        beforeEach(() => {
          mocked(fetchUser).mockResolvedValueOnce({
            userId,
            email: faker.internet.email()
          })
        })

        it('returns an unauthorised response', async () => {
          const result = await specificAdminUserAuthoriserFunction(
            event,
            context,
            jest.fn()
          )

          expectUnauthorised(result)
        })
      })

      describe("when the email matches the session user's email", () => {
        const email = faker.internet.email()
        const event = createAPIGatewayProxyEvent(
          {
            email
          },
          {},
          headers
        )

        beforeEach(() => {
          mocked(fetchUser).mockResolvedValueOnce({
            userId,
            email
          })
        })

        it('returns an authorised response', async () => {
          const result = await specificAdminUserAuthoriserFunction(
            event,
            context,
            jest.fn()
          )

          expectAuthorised(result)
        })
      })
    })
  })
})
