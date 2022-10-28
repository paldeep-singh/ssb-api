import { Table } from '@libs/dynamo-db'
import { STAGE } from '../../env'

export const ADMIN_USER_TABLE_NAME = `${STAGE}-admin-users-table`
export const ADMIN_USER_TABLE_REF = 'AdminUsersTable'
export const ADMIN_USER_EMAIL_INDEX_NAME = 'email-index'

export const VERIFICATION_CODE_TABLE_NAME = `${STAGE}-admin-users-verification-code-table`
export const VERIFICATION_CODE_TABLE_REF = 'AdminUsersVerificationCodeTable'

export const UPSTASH_URL_PARAMETER_NAME = `${STAGE}_UPSTASH_REDIS_REST_URL`
export const UPSTASH_TOKEN_PARAMETER_NAME = `${STAGE}_UPSTASH_REDIS_REST_TOKEN`

const AdminUsersTable: Table = {
  Type: 'AWS::DynamoDB::Table',
  Properties: {
    TableName: ADMIN_USER_TABLE_NAME,
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S'
      },
      {
        AttributeName: 'email',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH'
      }
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: ADMIN_USER_EMAIL_INDEX_NAME,
        KeySchema: [
          {
            AttributeName: 'email',
            KeyType: 'HASH'
          }
        ],
        Projection: {
          ProjectionType: 'ALL'
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1
        }
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  },
  // Change this in permanent deployment
  DeletionPolicy: 'Delete'
}

const AdminUsersVerificationCodeTable: Table = {
  Type: 'AWS::DynamoDB::Table',
  Properties: {
    TableName: VERIFICATION_CODE_TABLE_NAME,
    AttributeDefinitions: [
      {
        AttributeName: 'userId',
        AttributeType: 'S'
      }
    ],
    KeySchema: [
      {
        AttributeName: 'userId',
        KeyType: 'HASH'
      }
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1
    }
  },
  // Change this in permanent deployment
  DeletionPolicy: 'Delete'
}

const adminUserResources = {
  AdminUsersTable,
  AdminUsersVerificationCodeTable
}

export default adminUserResources
