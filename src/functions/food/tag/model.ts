import db, { ITag } from '../db'

export const getTags = async (): Promise<ITag[]> => {
  const session = db.session()

  const result = await session.run('MATCH (t:Tag) RETURN t')

  session.close()

  const tags = result.records.map<ITag>(
    (record) => record['_fields'][0].properties
  )

  return tags
}

export const createTag = async (name: string): Promise<ITag> => {
  const session = db.session()

  const result = await session.run(
    'CREATE (t:Tag { name: $name }) SET t.id = apoc.create.uuid() RETURN t',
    { name }
  )

  await session.close()

  const createdTag = result.records[0]['_fields'][0].properties

  return createdTag
}

export const getTag = async (id: string): Promise<ITag> => {
  const session = db.session()

  const result = await session.run('MATCH (t:Tag { id: $id }) RETURN t', { id })

  await session.close()

  const tag = result.records[0]['_fields'][0].properties

  return tag
}
