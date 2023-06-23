import { createLambdaRole } from '@libs/iam'

export const GET_TAGS_ROLE_NAME = 'getTagsRole'

export const getTagsRole = createLambdaRole({
  policyName: 'getTagsPolicy',
  roleName: GET_TAGS_ROLE_NAME
})

export const getTagRole = createLambdaRole({
  policyName: 'getTagPolicy',
  roleName: 'getTagRole'
})

export const createTagRole = createLambdaRole({
  policyName: 'createTagPolicy',
  roleName: 'createTagRole'
})

const tagRoles = {
  getTagsRole,
  getTagRole,
  createTagRole
}

export default tagRoles
