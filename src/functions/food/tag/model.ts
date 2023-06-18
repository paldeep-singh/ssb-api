import db, { ITag } from '../db'

const fetchTags = async (): Promise<ITag[]> => {
  const session = db.session()

  const result = await session.run('MATCH (t:Tag) RETURN t')

  session.close()

  const tags = result.records.map<ITag>(
    (record) => record['_fields'][0].properties
  )

  return tags
}
