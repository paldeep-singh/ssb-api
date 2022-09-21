import { Schema, model, aws } from "dynamoose";
import { Item } from "dynamoose/dist/Item";

const localDynamoDBEndpoint = process.env.LOCAL_DYNAMODB_ENDPOINT;

if (localDynamoDBEndpoint) {
  const localDDB = new aws.ddb.DynamoDB({
    region: "local",
    endpoint: localDynamoDBEndpoint,
  });

  aws.ddb.set(localDDB);
}

export const ADMIN_USERS_TABLE_NAME = "admin-users-table";

export interface IAdminUser {
  email: string;
  passwordHash: string;
}

const adminUserSchema = new Schema({
  email: {
    type: String,
    hashKey: true,
  },
  passwordHash: String,
});

interface adminUserItem extends Item, IAdminUser {}

export const adminUserModel = model<adminUserItem>(
  ADMIN_USERS_TABLE_NAME,
  adminUserSchema,
  {
    create: !!localDynamoDBEndpoint,
    waitForActive: !!localDynamoDBEndpoint,
  }
);

export enum ErrorCodes {
  NON_EXISTENT_ADMIN_USER = "NON_EXISTENT_ADMIN_USER",
}

export const adminUserExists = async (email: string) => {
  try {
    const response = await adminUserModel
      .query("email")
      .eq(email)
      .consistent()
      .count()
      .exec();

    return response.count !== 0;
  } catch (error) {
    throw error;
  }
};

export const adminUserPasswordIsSet = async (email: string) => {
  const adminUser = await adminUserModel.get(email);

  if (!adminUser) throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);

  return !!adminUser.passwordHash;
};

export const setAdminUserPassword = async ({
  email,
  newPassword,
  confirmNewPassword,
}: {
  email: string;
  newPassword: string;
  confirmNewPassword: string;
}) => {
  if (newPassword !== confirmNewPassword) {
    throw new Error("Passwords do not match");
  }

  const adminUser = await adminUserModel.get(email);

  if (!adminUser) {
    throw new Error("Admin user does not exist");
  }

  adminUser.passwordHash = newPassword;

  await adminUser.save();
};
