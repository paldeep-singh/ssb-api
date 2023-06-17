import { cors } from '@functions/constants'
import { handlerPath, handlerRoute } from '@libs/handler-resolver'
import { AWS } from '@serverless/typescript'
import { GET_TAGS_ROLE_NAME } from './roles'

const path = handlerPath(__dirname)
const route = handlerRoute(__dirname)

const tagFunctions: AWS['functions'] = {
  getTags: {
    handler: `${path}/handlers.handleGetTags`,
    events: [
      {
        http: {
          method: 'get',
          path: `${route}/all`,
          cors
        }
      }
    ],
    role: GET_TAGS_ROLE_NAME
  }
}

export default tagFunctions
