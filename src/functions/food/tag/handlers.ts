import {
  LambdaEventWithSchemaAndResult,
  formatJSONErrorResponse,
  formatJSONResponse
} from '@libs/api-gateway'
import db, { ITag } from '../db'
import { isError } from '@libs/utils'

const getTags: LambdaEventWithSchemaAndResult = async () => {
  try {
    const session = db.session()

    const result = await session.run('MATCH (t:Tag) RETURN t')

    session.close()

    const tags = result.records.map<ITag>(
      (record) => record['_fields'][0].properties
    )

    return formatJSONResponse(200, { tags })
  } catch (error) {
    if (!isError(error)) throw error

    return formatJSONErrorResponse(500, error.message)
  }
}

export const handleGetTags = getTags
