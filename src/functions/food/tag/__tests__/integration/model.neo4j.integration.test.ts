import { createTag, fetchTag, fetchTags } from '../../model'
import db from '../../../db'
import { faker } from '@faker-js/faker'

afterAll(async () => {
  await db.close()
})

describe('createTag', () => {
  it('creates a tag', async () => {
    const name = faker.word.noun()
    const returnedTag = await createTag(name)

    expect(returnedTag).toEqual({
      id: expect.any(String),
      name
    })

    const session = db.session()

    const result = await session.run('MATCH (t:Tag {name: $name}) RETURN t', {
      name
    })

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

describe('fetchTags', () => {
  it('fetches tags', async () => {
    const tags = Array.from({ length: 5 }, () => ({
      name: faker.word.noun(),
      id: faker.datatype.uuid()
    }))

    const session = db.session()

    await session.run(
      `UNWIND $tags AS tagProperties CREATE (t:Tag) SET t = tagProperties`,
      { tags }
    )

    await session.close()

    const returnedTags = await fetchTags()

    expect(returnedTags).toEqual(expect.arrayContaining(tags))
  })
})

describe('fetchTag', () => {
  it('fetches a tag', async () => {
    const tag = {
      name: faker.word.noun(),
      id: faker.datatype.uuid()
    }

    const session = db.session()

    await session.run(
      `UNWIND $tag AS tagProperties CREATE (t:Tag) SET t = tagProperties`,
      { tag }
    )

    await session.close()

    const returnedTag = await fetchTag(tag.id)

    expect(returnedTag).toEqual(tag)
  })
})
