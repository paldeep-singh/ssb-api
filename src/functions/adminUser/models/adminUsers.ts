import { model, Schema, transaction } from 'dynamoose'
import { Item } from 'dynamoose/dist/Item'
import { Query } from 'dynamoose/dist/ItemRetriever'
import { ErrorCodes } from '../misc'
import {
  ADMIN_USER_EMAIL_INDEX_NAME,
  ADMIN_USER_TABLE_NAME
} from '../resources'
import { baseTableConfig } from '../misc'

export interface IAdminUser {
  userId: string
  email: string
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
  passwordHash: String
})

interface adminUserItem extends Item, IAdminUser {}

export const adminUserModel = model<adminUserItem>(
  ADMIN_USER_TABLE_NAME,
  adminUserSchema,
  baseTableConfig
)

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
  email,
  newPasswordHash
}: {
  email: string
  newPasswordHash: string
}): Promise<void> => {
  const [adminUser] = await queryAdminUserByEmail(email).exec()

  if (!adminUser) {
    throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER)
  }

  const updateTransaction = adminUserModel.transaction.update(
    {
      userId: adminUser.userId
    },
    {
      $SET: {
        passwordHash: newPasswordHash
      }
    }
  )

  await transaction([updateTransaction])
}
