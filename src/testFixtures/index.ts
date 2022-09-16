import { adminUserModel, IAdminUser } from "../dynamoDB";
import { faker } from "@faker-js/faker";

export const createAdminUser = (
  adminUserAttributes: Partial<IAdminUser>
): IAdminUser => ({
  email: faker.internet.email(),
  passwordHash: faker.internet.password(),
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
