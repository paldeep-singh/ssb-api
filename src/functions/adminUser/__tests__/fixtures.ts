import { adminUserModel, IAdminUser, verificationCodeModel } from "../model";
import { faker } from "@faker-js/faker";

export const createAdminUser = (
  adminUserAttributes: Partial<IAdminUser>
): IAdminUser => ({
  userId: faker.datatype.uuid(),
  email: faker.internet.email(),
  passwordHash: faker.internet.password(),
  passwordSalt: faker.datatype.string(20),
  ...adminUserAttributes,
});

export const insertTestAdminUser = async (
  adminUser: IAdminUser
): Promise<void> => {
  await adminUserModel.create(adminUser);
};

export const deleteTestAdminUser = async (userId: string) => {
  await adminUserModel.delete(userId);
};

export const fetchTestAdminUser = async (userId: string) => {
  return await adminUserModel.get(userId);
};

export const fetchTestVerificationCode = async (email: string) => {
  return await verificationCodeModel.get(email);
};

export const deleteTestVerificationCode = async (email: string) => {
  await verificationCodeModel.delete(email);
};
