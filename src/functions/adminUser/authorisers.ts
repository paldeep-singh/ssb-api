import { LambdaEventWithUnknownSchema } from '@libs/api-gateway'
import { parse } from 'path'
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

export const specificAdminUserAuthoriserFunction: LambdaEventWithUnknownSchema<
  IAuthoriserResult
> = async (event) => {
  const { headers, body } = event

  if (!headers?.Authorization) {
    return createAuthoriserResult(false)
  }

  const sessionID = headers.Authorization

  console.log('got here 1')
  if (!body) return createAuthoriserResult(false)
  console.log('got here 2')
  const parsedBody = JSON.parse(body)

  const bodyIsObject =
    typeof parsedBody === 'object' &&
    !Array.isArray(parsedBody) &&
    parsedBody !== null

  if (!bodyIsObject) {
    return createAuthoriserResult(false)
  }

  const { email, userId } = parsedBody

  if (!email && !userId) {
    return createAuthoriserResult(false)
  }

  const session = await fetchSession(sessionID)

  if (!session) {
    return createAuthoriserResult(false)
  }

  const {
    sessionData: { userId: sessionUserId }
  } = session

  if (userId) {
    return createAuthoriserResult(userId === sessionUserId)
  }

  const adminUser = await fetchUser(userId)

  return createAuthoriserResult(adminUser.email === email)
}
