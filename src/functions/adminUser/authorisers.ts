import { LamdaCustomAuthoriserHandler } from '@libs/api-gateway'
import { fetchUser } from './models/adminUsers'
import { fetchSession } from './models/sessions'
import { CustomAuthoriserResult } from '@libs/api-gateway'
export const SPECIFIC_ADMIN_USER_AUTHORISER = 'specificAdminUserAuthoriser'
export const SPECIFIC_ADMIN_USER_AUTHORISER_FUNCTION = `${SPECIFIC_ADMIN_USER_AUTHORISER}Function`

interface IAuthoriserResultParams {
  isAuthorized: boolean
  principalId: string
  usageIdentifierKey?: string
  resource: string
  context?: Record<string, unknown>
}

const createAuthoriserResult = ({
  isAuthorized,
  principalId,
  resource,
  usageIdentifierKey,
  context
}: IAuthoriserResultParams): CustomAuthoriserResult => {
  return {
    principalId,
    policyDocument: {
      Version: '2012-10-17',
      Statement: [
        {
          Action: 'execute-api:Invoke',
          Effect: isAuthorized ? 'Allow' : 'Deny',
          Resource: resource
        }
      ]
    },
    usageIdentifierKey,
    context
  }
}

export const specificAdminUserAuthoriserFunction: LamdaCustomAuthoriserHandler =
  async (event) => {
    const {
      headers,
      body,
      methodArn,
      requestContext: {
        authorizer: { principalId }
      }
    } = event

    const authParams = {
      principalId,
      resource: methodArn
    }

    if (!headers?.Authorization) {
      return createAuthoriserResult({
        isAuthorized: false,
        ...authParams
      })
    }

    const sessionID = headers.Authorization

    if (!body)
      return createAuthoriserResult({
        isAuthorized: false,
        ...authParams
      })
    const parsedBody = JSON.parse(body)

    const bodyIsObject =
      typeof parsedBody === 'object' &&
      !Array.isArray(parsedBody) &&
      parsedBody !== null

    if (!bodyIsObject) {
      return createAuthoriserResult({
        isAuthorized: false,
        ...authParams
      })
    }

    const { email, userId } = parsedBody

    if (!email && !userId) {
      return createAuthoriserResult({
        isAuthorized: false,
        ...authParams
      })
    }

    const session = await fetchSession(sessionID)

    if (!session) {
      return createAuthoriserResult({
        isAuthorized: false,
        ...authParams
      })
    }

    const {
      sessionData: { userId: sessionUserId }
    } = session

    if (userId) {
      return createAuthoriserResult({
        isAuthorized: userId === sessionUserId,
        ...authParams
      })
    }

    const adminUser = await fetchUser(userId)

    return createAuthoriserResult({
      isAuthorized: adminUser.email === email,
      ...authParams
    })
  }
