import {
  adminUserEmailInput,
  adminUserLoginInput,
  adminUserSetPasswordInput,
  adminUserVerifyEmailInput
} from './schema'
import { handlerPath, handlerRoute } from '@libs/handler-resolver'
import { AWS } from '@serverless/typescript'
import {
  SPECIFIC_ADMIN_USER_AUTHORISER,
  SPECIFIC_ADMIN_USER_AUTHORISER_FUNCTION
} from './authorisers'
import { cors } from '@functions/constants'

const path = handlerPath(__dirname)
const route = handlerRoute(__dirname)

const adminUserFunctions: AWS['functions'] = {
  [SPECIFIC_ADMIN_USER_AUTHORISER]: {
    handler: `${path}/authorisers.${SPECIFIC_ADMIN_USER_AUTHORISER_FUNCTION}`,
    role: 'adminUserSpecificAuthoriserRole'
  },
  adminUserAccountIsClaimed: {
    handler: `${path}/handlers.handleCheckAdminUserAccountIsClaimed`,
    events: [
      {
        http: {
          method: 'post',
          path: `${route}/claimed`,
          cors,
          request: {
            schemas: {
              'application/json': adminUserEmailInput
            }
          }
        }
      }
    ],
    role: 'adminUserAccountIsClaimedRole'
  },
  setAdminUserPassword: {
    handler: `${path}/handlers.handleSetAdminUserPassword`,
    events: [
      {
        http: {
          method: 'post',
          path: `${route}/set-password`,
          cors,
          request: {
            schemas: {
              'application/json': adminUserSetPasswordInput
            },
            parameters: {
              headers: {
                Authorization: true
              }
            }
          },
          authorizer: {
            name: SPECIFIC_ADMIN_USER_AUTHORISER
          }
        }
      }
    ],
    role: 'setAdminUserPasswordRole'
  },
  sendAdminUserVerificationCode: {
    handler: `${path}/handlers.handleSendAdminUserVerificationCode`,
    events: [
      {
        http: {
          method: 'post',
          path: `${route}/request-verification`,
          cors,
          request: {
            schemas: {
              'application/json': adminUserEmailInput
            }
          }
        }
      }
    ],
    role: 'sendAdminUserVerificationCodeRole'
  },
  verifyAdminUserEmail: {
    handler: `${path}/handlers.handleVerifyAdminUserEmail`,
    events: [
      {
        http: {
          method: 'post',
          path: `${route}/verify-email`,
          cors,
          request: {
            schemas: {
              'application/json': adminUserVerifyEmailInput
            }
          }
        }
      }
    ],
    role: 'verifyAdminUserEmailRole'
  },
  login: {
    handler: `${path}/handlers.handleLogin`,
    events: [
      {
        http: {
          method: 'post',
          path: `${route}/login`,
          cors,
          request: {
            schemas: {
              'application/json': adminUserLoginInput
            }
          }
        }
      }
    ],
    role: 'adminUserLoginRole'
  },
  getAdminUserDetails: {
    handler: `${path}/handlers.handleGetAdminUserDetails`,
    events: [
      {
        http: {
          method: 'get',
          path: `${route}/details`,
          cors,
          request: {
            parameters: {
              headers: {
                Authorization: true
              }
            }
          },
          authorizer: {
            name: SPECIFIC_ADMIN_USER_AUTHORISER
          }
        }
      }
    ]
  }
}

export default adminUserFunctions
