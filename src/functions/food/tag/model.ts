import db, { ITag } from '../db'

export const fetchTags = async (): Promise<ITag['properties'][]> => {
  const session = db.session()

  const result = await session.run('MATCH (t:Tag) RETURN t')

  session.close()

  const tags = result.records.map<ITag['properties']>(
    (record) => record['_fields'][0].properties
  )

  return tags
}

export const createTag = async (
  tag: Pick<ITag['properties'], 'name'>
): Promise<ITag['properties']> => {
  const session = db.session()

  const result = await session.run(
    'CREATE (t:Tag { name: $name }) SET t.id = apoc.create.uuid() RETURN t',
    tag
  )

  await session.close()

  const createdTag = result.records[0]['_fields'][0].properties

  return createdTag
}
