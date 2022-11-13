import { model, Schema, transaction, Condition } from 'dynamoose'
import { Item } from 'dynamoose/dist/Item'
import { Query } from 'dynamoose/dist/ItemRetriever'
import { ErrorCodes } from '../misc'
import {
  ADMIN_USER_EMAIL_INDEX_NAME,
  ADMIN_USER_TABLE_NAME
} from '../resources'
import { baseTableConfig } from '../misc'
import { isError } from 'lodash'

export interface IAdminUser {
  userId: string
  email: string
  name: string
  passwordHash?: string
}

const adminUserSchema = new Schema({
  userId: {
    type: String,
    hashKey: true
  },
  email: {
    type: String,
    index: {
      type: 'global',
      name: ADMIN_USER_EMAIL_INDEX_NAME,
      project: true
    }
  },
  passwordHash: String,
  name: String
})

interface adminUserItem extends Item, IAdminUser {}

export const adminUserModel = model<adminUserItem>(
  ADMIN_USER_TABLE_NAME,
  adminUserSchema,
  baseTableConfig
)

const TRANSACTION_CONDITIONAL_CHECK_FAILED_ERROR = new RegExp(
  'ConditionalCheckFailed'
)

const isTransactionConditionalCheckFailedError = (error: Error): boolean =>
  !!error.message.match(TRANSACTION_CONDITIONAL_CHECK_FAILED_ERROR)

const queryAdminUserByEmail = (email: string): Query<IAdminUser> => {
  return adminUserModel.query('email').eq(email)
}

export const adminUserEmailExists = async (email: string): Promise<boolean> => {
  const response = await queryAdminUserByEmail(email).count().exec()

  return response.count !== 0
}

export const fetchUserByEmail = async (email: string): Promise<IAdminUser> => {
  const [adminUser] = await queryAdminUserByEmail(email).exec()

  if (!adminUser) throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)

  return adminUser
}

export const fetchUser = async (userId: string): Promise<IAdminUser> => {
  const adminUser = await adminUserModel.get(userId)

  if (!adminUser) throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)

  return adminUser
}

export const updatePassword = async ({
  userId,
  newPasswordHash
}: {
  userId: string
  newPasswordHash: string
}): Promise<void> => {
  const updateTransaction = adminUserModel.transaction.update(
    {
      userId
    },
    {
      $SET: {
        passwordHash: newPasswordHash
      }
    },
    {
      condition: new Condition().attribute('userId').exists()
    }
  )

  try {
    await transaction([updateTransaction])
  } catch (error) {
    if (!isError(error)) throw error

    if (isTransactionConditionalCheckFailedError(error)) {
      throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
    }

    throw error
  }
}
