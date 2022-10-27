import {
  LambdaEventWithSchemaAndResult,
  LambdaEventWithUnknownSchema
} from '@libs/api-gateway'
import { fetchUser } from './models/adminUsers'
import { fetchSession } from './models/sessions'

export const SPECIFIC_ADMIN_USER_AUTHORISER = 'specificAdminUserAuthoriser'
export const SPECIFIC_ADMIN_USER_AUTHORISER_FUNCTION = `${SPECIFIC_ADMIN_USER_AUTHORISER}Function`

type IAuthoriserResult = {
  isAuthorized: boolean
  context?: Record<string, unknown>
}

const createAuthoriserResult = (
  isAuthorized: boolean,
  context?: Record<string, unknown>
): IAuthoriserResult => {
  return {
    isAuthorized,
    context
  }
}

export const specificAdminUserAuthoriser: LambdaEventWithUnknownSchema<
  IAuthoriserResult
> = async (event) => {
  const { headers, body } = event

  if (!headers || !headers.Authorization) {
    return createAuthoriserResult(false)
  }

  const sessionID = headers.Authorization

  const bodyIsObject =
    typeof body === 'object' && !Array.isArray(body) && body !== null

  if (!bodyIsObject) {
    return createAuthoriserResult(false)
  }

  const { email, userId } = body as Record<string, string>

  if (!email && !userId) {
    return createAuthoriserResult(false)
  }

  const session = await fetchSession(sessionID)

  if (!session) return createAuthoriserResult(false)

  const {
    sessionData: { userId: sessionUserId }
  } = session

  if (userId) {
    return createAuthoriserResult(userId === sessionUserId)
  }

  const adminUser = await fetchUser(userId)

  return createAuthoriserResult(adminUser.email === email)
}
