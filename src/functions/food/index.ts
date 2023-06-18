import { AWS } from '@serverless/typescript'
import tagFunctions from './tag'

const foodFunctions: AWS['functions'] = {
  ...tagFunctions
}

export default foodFunctions
