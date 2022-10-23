import type { AWS } from '@serverless/typescript'
import {
  SPECIFIC_ADMIN_USER_AUTHORISER,
  SPECIFIC_ADMIN_USER_AUTHORISER_FUNCTION
} from './authorisers'

export const adminUserProvider: AWS['provider']['httpApi'] = {
  authorizers: {
    [SPECIFIC_ADMIN_USER_AUTHORISER]: {
      type: 'request',
      functionName: SPECIFIC_ADMIN_USER_AUTHORISER_FUNCTION,
      identitySource: ['$request.header.Authorization'],
      payloadVersion: '2.0',
      enableSimpleResponses: true,
      name: SPECIFIC_ADMIN_USER_AUTHORISER
    }
  }
}
