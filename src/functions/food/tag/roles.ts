import { createLambdaRole } from '@libs/iam'

export const GET_TAGS_ROLE_NAME = 'getTagsRole'

export const getTagsRole = createLambdaRole({
  policyName: 'getTagsPolicy',
  roleName: GET_TAGS_ROLE_NAME
})

const tagRoles = {
  getTagsRole
}

export default tagRoles
