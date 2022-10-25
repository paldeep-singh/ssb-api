import {
  LambdaEventWithSchemaAndResult,
  LambdaEventWithUnknownSchema
} from '@libs/api-gateway'
import { fetchUser } from './models/adminUsers'
import { fetchSession } from './models/sessions'

export const SPECIFIC_ADMIN_USER_AUTHORISER = 'specificAdminUserAuthoriser'
export const SPECIFIC_ADMIN_USER_AUTHORISER_FUNCTION = `${SPECIFIC_ADMIN_USER_AUTHORISER}Function`

const specificAdminUserAuthoriser: LambdaEventWithUnknownSchema<
  boolean
> = async (event): Promise<boolean> => {
  const { headers, body } = event

  if (!headers || !headers.Authorization) {
    return Promise.resolve(false)
  }

  const sessionID = headers.Authorization

  const bodyIsObject =
    typeof body === 'object' && !Array.isArray(body) && body !== null

  if (!bodyIsObject) {
    return Promise.resolve(false)
  }

  const { email, userId } = body as Record<string, string>

  if (!email && !userId) {
    return Promise.resolve(false)
  }

  const session = await fetchSession(sessionID)

  if (!session) return Promise.resolve(false)

  const {
    sessionData: { userId: sessionUserId }
  } = session

  if (userId) {
    return Promise.resolve(userId === sessionUserId)
  }

  const adminUser = await fetchUser(userId)

  return adminUser.email === email
}
