import { adminUserModel, IAdminUser } from "../model";
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

export const deleteTestAdminUser = async (email: string) => {
  await adminUserModel.delete(email);
};

export const fetchTestAdminUser = async (email: string) => {
  return await adminUserModel.get(email);
};
