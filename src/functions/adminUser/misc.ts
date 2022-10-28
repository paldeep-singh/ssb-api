import { LOCAL_DYNAMODB_ENDPOINT } from '../../env'
import { aws } from 'dynamoose'

export enum ErrorCodes {
  NON_EXISTENT_ADMIN_USER = 'NON_EXISTENT_ADMIN_USER',
  PASSWORD_MISMATCH = 'PASSWORD_MISMATCH',
  ENCRYPTION_FAILED = 'ENCRYPTION_FAILED',
  ACCOUNT_UNCLAIMED = 'ACCOUNT_UNCLAIMED',
  INVALID_PASSWORD = 'INVALID_PASSWORD',
  NO_ACTIVE_VERIFICATION_CODE = 'NO_ACTIVE_VERIFICATION_CODE',
  INVALID_VERIFICATION_CODE = 'INVALID_VERIFICATION_CODE',
  VERIFICATION_CODE_EXPIRED = 'VERIFICATION_CODE_EXPIRED',
  PASSWORD_TOO_LONG = 'PASSWORD_TOO_LONG'
}

if (LOCAL_DYNAMODB_ENDPOINT) {
  const localDDB = new aws.ddb.DynamoDB({
    region: 'local',
    endpoint: LOCAL_DYNAMODB_ENDPOINT
  })

  aws.ddb.set(localDDB)
}

export const baseTableConfig = {
  create: !!LOCAL_DYNAMODB_ENDPOINT,
  waitForActive: !!LOCAL_DYNAMODB_ENDPOINT
}
