import { faker } from '@faker-js/faker'
import {
  createAPIGatewayProxyEvent,
  createAPIGatewayProxyEventContext,
  createAPIGatewayProxyEventWithNoBody
} from '@libs/fixtures'
import { handleCreateTag, handleGetTag, handleGetTags } from '../handlers'
import { mocked } from 'jest-mock'
import { createTag, getTag, getTags } from '../model'

jest.mock('../model')

beforeEach(() => {
  jest.clearAllMocks()
})

const context = createAPIGatewayProxyEventContext()

describe('handleGetTags', () => {
  const APIGatewayEvent = createAPIGatewayProxyEventWithNoBody()

  describe('when the request is successful', () => {
    const tags = Array.from({ length: 5 }, () => ({
      name: faker.word.noun(),
      id: faker.datatype.uuid()
    }))

    beforeEach(() => {
      mocked(getTags).mockResolvedValueOnce(tags)
    })

    it('returns a 200 response', async () => {
      const response = await handleGetTags(APIGatewayEvent, context, jest.fn())

      expect(response.statusCode).toEqual(200)
    })

    it('returns the tags', async () => {
      const response = await handleGetTags(APIGatewayEvent, context, jest.fn())

      expect(JSON.parse(response.body)).toEqual({
        tags: expect.arrayContaining(tags)
      })
    })
  })

  describe('when the request is unsuccessful', () => {
    const errorMessage = faker.lorem.sentence()

    beforeEach(() => {
      mocked(getTags).mockRejectedValueOnce(new Error(errorMessage))
    })
    it('returns a 500 response', async () => {
      const response = await handleGetTags(APIGatewayEvent, context, jest.fn())

      expect(response.statusCode).toEqual(500)
    })

    it('returns the error message', async () => {
      const response = await handleGetTags(APIGatewayEvent, context, jest.fn())

      expect(JSON.parse(response.body)).toEqual({ message: errorMessage })
    })
  })
})

describe('handleCreateTag', () => {
  const name = faker.word.noun()
  const tag = {
    name,
    id: faker.datatype.uuid()
  }
  const APIGatewayEvent = createAPIGatewayProxyEvent({
    name
  })
  describe('when the request is successful', () => {
    beforeEach(() => {
      mocked(createTag).mockResolvedValueOnce(tag)
    })
    it('returns a 200 response', async () => {
      const response = await handleCreateTag(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(response.statusCode).toEqual(200)
    })

    it('returns the tag', async () => {
      const response = await handleCreateTag(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(JSON.parse(response.body)).toEqual({
        tag
      })
    })
  })

  describe('when the request is unsuccessful', () => {
    const errorMessage = faker.lorem.sentence()

    beforeEach(() => {
      mocked(createTag).mockRejectedValueOnce(new Error(errorMessage))
    })
    it('returns a 500 response', async () => {
      const response = await handleCreateTag(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(response.statusCode).toEqual(500)
    })

    it('returns the error message', async () => {
      const response = await handleCreateTag(
        APIGatewayEvent,
        context,
        jest.fn()
      )

      expect(JSON.parse(response.body)).toEqual({ message: errorMessage })
    })
  })
})

describe('handleGetTag', () => {
  const name = faker.word.noun()
  const id = faker.datatype.uuid()
  const tag = { name, id }

  const APIGatewayEvent = createAPIGatewayProxyEvent({
    id
  })

  describe('when the request is successful', () => {
    beforeEach(() => {
      mocked(getTag).mockResolvedValueOnce(tag)
    })

    it('returns a 200 response', async () => {
      const response = await handleGetTag(APIGatewayEvent, context, jest.fn())

      expect(response.statusCode).toEqual(200)
    })

    it('returns the tag', async () => {
      const response = await handleGetTag(APIGatewayEvent, context, jest.fn())

      expect(JSON.parse(response.body)).toEqual({
        tag
      })
    })
  })

  describe('when the request is unsuccessful', () => {
    const errorMessage = faker.lorem.sentence()

    beforeEach(() => {
      mocked(getTag).mockRejectedValueOnce(new Error(errorMessage))
    })

    it('returns a 500 response', async () => {
      const response = await handleGetTag(APIGatewayEvent, context, jest.fn())

      expect(response.statusCode).toEqual(500)
    })

    it('returns the error message', async () => {
      const response = await handleGetTag(APIGatewayEvent, context, jest.fn())

      expect(JSON.parse(response.body)).toEqual({ message: errorMessage })
    })
  })
})
