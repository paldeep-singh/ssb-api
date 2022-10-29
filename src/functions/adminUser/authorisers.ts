import { fetchSession } from './models/sessions'
import {
  APIGatewayAuthorizerResult,
  APIGatewayAuthorizerResultContext,
  APIGatewayTokenAuthorizerHandler
} from 'aws-lambda'

export const SPECIFIC_ADMIN_USER_AUTHORISER = 'specificAdminUserAuthoriser'
export const SPECIFIC_ADMIN_USER_AUTHORISER_FUNCTION = `${SPECIFIC_ADMIN_USER_AUTHORISER}Function`

interface IAuthoriserResultParams {
  isAuthorized: boolean
  principalId: string
  usageIdentifierKey?: string
  resource: string
  context?: APIGatewayAuthorizerResultContext
}

const createAuthoriserResult = ({
  isAuthorized,
  principalId,
  resource,
  usageIdentifierKey,
  context
}: IAuthoriserResultParams): APIGatewayAuthorizerResult => {
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

export const specificAdminUserAuthoriserFunction: APIGatewayTokenAuthorizerHandler =
  async (event) => {
    const { authorizationToken, methodArn } = event

    const authParams = {
      principalId: authorizationToken,
      resource: methodArn
    }

    if (!authorizationToken) {
      return createAuthoriserResult({
        ...authParams,
        isAuthorized: false
      })
    }

    const session = await fetchSession(authorizationToken)

    if (!session) {
      return createAuthoriserResult({
        isAuthorized: false,
        ...authParams
      })
    }

    return createAuthoriserResult({
      isAuthorized: true,
      ...authParams
    })
  }
