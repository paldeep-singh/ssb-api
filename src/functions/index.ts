import { AWS } from '@serverless/typescript'
import adminUserFunctions from './adminUser'
import foodFunctions from './food'

const functions: AWS['functions'] = {
  ...adminUserFunctions,
  ...foodFunctions
}

export default functions
