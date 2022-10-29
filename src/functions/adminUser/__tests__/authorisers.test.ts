import { GetParameterCommand, SSMClient } from '@aws-sdk/client-ssm'
import { faker } from '@faker-js/faker'
import {
  createAPIGatewayProxyEvent,
  createAPIGatewayProxyEventContext,
  createTokenAuthorisationEvent
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

const expectUnauthorised = (
  result: unknown,
  principalId: string,
  resource: string,
  context?: Record<string, unknown>,
  usageIdentifierKey?: string
) => {
  expect(result).toEqual({
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Deny',
          Resource: resource
        }
      ]
    },
    usageIdentifierKey,
    context
  })
}

const expectAuthorised = (
  result: unknown,
  principalId: string,
  resource: string,
  context?: Record<string, unknown>,
  usageIdentifierKey?: string
) => {
  expect(result).toEqual({
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: 'Allow',
          Resource: resource
        }
      ]
    },
    usageIdentifierKey,
    context
  })
}

describe('specificAdminUserAuthoriser', () => {
  const sessionId = faker.datatype.uuid()
  const methodArn = faker.datatype.uuid()
  const tokenAuthorisationEvent = createTokenAuthorisationEvent({
    methodArn,
    authorizationToken: sessionId
  })
  const context = createAPIGatewayProxyEventContext()

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
  })

  describe('when the session exists', () => {
    const userId = faker.datatype.uuid()
    const sessionData = JSON.stringify({
      userId
    })

    beforeEach(() => {
      redisScope
        .get(`/get/${sessionId}`)
        .matchHeader('Authorization', `Bearer ${redisToken}`)
        .reply(200, {
          result: sessionData
        })
    })

    it('fetches the session details from redis', async () => {
      await specificAdminUserAuthoriserFunction(
        tokenAuthorisationEvent,
        context,
        jest.fn()
      )
      expect(redisScope.isDone()).toBeTruthy()
    })

    it('returns an authorised result', async () => {
      const result = await specificAdminUserAuthoriserFunction(
        tokenAuthorisationEvent,
        context,
        jest.fn()
      )
      expectAuthorised(result, sessionId, methodArn)
    })
  })

  describe('when the session does not exist', () => {
    beforeEach(() => {
      redisScope
        .get(`/get/${sessionId}`)
        .matchHeader('Authorization', `Bearer ${redisToken}`)
        .reply(200, {
          result: null
        })
    })

    it('fetches the session details from redis', async () => {
      await specificAdminUserAuthoriserFunction(
        tokenAuthorisationEvent,
        context,
        jest.fn()
      )
      expect(redisScope.isDone()).toBeTruthy()
    })

    it('returns an unauthorised result', async () => {
      const result = await specificAdminUserAuthoriserFunction(
        tokenAuthorisationEvent,
        context,
        jest.fn()
      )
      expectUnauthorised(result, sessionId, methodArn)
    })
  })
})
