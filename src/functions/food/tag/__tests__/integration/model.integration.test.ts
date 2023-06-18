import { createTag } from '../../model'
import db from '../../../db'

afterAll(async () => {
  await db.close()
})

describe('createTag', () => {
  it('creates a tag', async () => {
    const returnedTag = await createTag({ name: 'test' })

    expect(returnedTag).toEqual({
      id: expect.any(String),
      name: 'test'
    })

    const session = db.session()

    const result = await session.run('MATCH (t:Tag {name: "test"}) RETURN t')

    await session.close()

    const tags = result.records.map((record) => record['_fields'][0].properties)

    expect(tags).toEqual([
      {
        id: returnedTag.id,
        name: returnedTag.name
      }
    ])
  })
})
