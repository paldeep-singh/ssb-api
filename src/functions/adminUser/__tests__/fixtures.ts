import {
  IVerificationCode,
  verificationCodeModel
} from '../models/verificationCodes'
import { IAdminUser, adminUserModel } from '../models/adminUsers'
import { faker } from '@faker-js/faker'

export const createAdminUser = (
  adminUserAttributes: Partial<IAdminUser> = {}
): IAdminUser => ({
  userId: faker.datatype.uuid(),
  email: faker.internet.email(),
  passwordHash: faker.datatype.string(20),
  name: faker.name.firstName(),
  ...adminUserAttributes
})

export const createVerificationCode = (
  verficationCodeAttributes: Partial<IVerificationCode> = {}
): IVerificationCode => ({
  userId: faker.datatype.uuid(),
  codeHash: faker.datatype.string(20),
  ttl: faker.date.soon().toISOString(),
  ...verficationCodeAttributes
})

export const insertTestAdminUser = async (
  adminUser: IAdminUser
): Promise<void> => {
  await adminUserModel.create(adminUser)
}

export const deleteTestAdminUser = async (userId: string): Promise<void> => {
  await adminUserModel.delete(userId)
}

export const fetchTestAdminUser = async (
  userId: string
): Promise<IAdminUser> => {
  return await adminUserModel.get(userId)
}

export const fetchTestVerificationCode = async (
  email: string
): Promise<IVerificationCode> => {
  return await verificationCodeModel.get(email)
}

export const deleteTestVerificationCode = async (
  email: string
): Promise<void> => {
  await verificationCodeModel.delete(email)
}
