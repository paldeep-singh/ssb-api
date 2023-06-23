import {
  LambdaEventWithSchemaAndResult,
  bodyParser,
  formatJSONErrorResponse,
  formatJSONResponse
} from '@libs/api-gateway'
import { isError } from '@libs/utils'
import { createTag, getTag, getTags } from './model'
import { ICreateTagInput, IGetTagInput } from './schema'

export const handleGetTags: LambdaEventWithSchemaAndResult = async () => {
  try {
    const tags = await getTags()

    return formatJSONResponse(200, { tags })
  } catch (error) {
    if (!isError(error)) throw error

    return formatJSONErrorResponse(500, error.message)
  }
}

export const createTagResolver: LambdaEventWithSchemaAndResult<
  ICreateTagInput
> = async ({ body: { name } }) => {
  try {
    const tag = await createTag(name)

    return formatJSONResponse(200, { tag })
  } catch (error) {
    if (!isError(error)) throw error

    return formatJSONErrorResponse(500, error.message)
  }
}

export const handleCreateTag = bodyParser<ICreateTagInput>(createTagResolver)

export const getTagResolver: LambdaEventWithSchemaAndResult<
  IGetTagInput
> = async ({ body: { id } }) => {
  try {
    const tag = await getTag(id)

    return formatJSONResponse(200, { tag })
  } catch (error) {
    if (!isError(error)) throw error

    return formatJSONErrorResponse(500, error.message)
  }
}

export const handleGetTag = bodyParser<IGetTagInput>(getTagResolver)
