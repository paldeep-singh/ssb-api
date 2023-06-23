export interface IGetTagInput {
  id: string
}

export const getTagInput = {
  type: 'object',
  properties: {
    id: { type: 'string' }
  },
  required: ['id']
} as const

export interface ICreateTagInput {
  name: string
}

export const createTagInput = {
  type: 'object',
  properties: {
    name: { type: 'string' }
  },
  required: ['name']
} as const
