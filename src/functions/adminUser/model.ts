import { Schema, model, aws, transaction } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { LOCAL_DYNAMODB_ENDPOINT } from "@libs/env";
import {
  ADMIN_USER_EMAIL_INDEX_NAME,
  ADMIN_USER_PASSWORD_KEY_ALIAS,
  ADMIN_USER_TABLE_NAME,
} from "./resources";
import { Codes } from "./Error";

if (LOCAL_DYNAMODB_ENDPOINT) {
  const localDDB = new aws.ddb.DynamoDB({
    region: "local",
    endpoint: LOCAL_DYNAMODB_ENDPOINT,
  });

  aws.ddb.set(localDDB);
}
export interface IAdminUser {
  userId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}

const adminUserSchema = new Schema({
  userId: {
    type: String,
    hashKey: true,
  },
  email: {
    type: String,
    index: {
      type: "global",
      name: ADMIN_USER_EMAIL_INDEX_NAME,
      project: true,
    },
  },
  passwordHash: String,
  passwordSalt: String,
});

interface adminUserItem extends Item, IAdminUser {}

export const adminUserModel = model<adminUserItem>(
  ADMIN_USER_TABLE_NAME,
  adminUserSchema,
  {
    create: !!LOCAL_DYNAMODB_ENDPOINT,
    waitForActive: !!LOCAL_DYNAMODB_ENDPOINT,
  }
);

const queryAdminUserByEmail = (email: string) => {
  return adminUserModel.query("email").eq(email);
};

export const userDocumentExists = async (email: string) => {
  try {
    const response = await queryAdminUserByEmail(email).count().exec();

    return response.count !== 0;
  } catch (error) {
    throw error;
  }
};

export const fetchUserByEmail = async (email: string): Promise<IAdminUser> => {
  const [adminUser] = await queryAdminUserByEmail(email).exec();

  if (!adminUser) throw new Error(Codes.NON_EXISTENT_ADMIN_USER);

  return adminUser;
};

export const setPassword = async ({
  email,
  newPasswordHash,
  newPasswordSalt,
}: {
  email: string;
  newPasswordHash: string;
  newPasswordSalt: string;
}) => {
  const [adminUser] = await queryAdminUserByEmail(email).exec();

  if (!adminUser) {
    throw new Error(Codes.NON_EXISTENT_ADMIN_USER);
  }

  const updateTransaction = adminUserModel.transaction.update(
    {
      userId: adminUser.userId,
    },
    {
      $SET: {
        passwordHash: newPasswordHash,
        passwordSalt: newPasswordSalt,
      },
    }
  );

  await transaction([updateTransaction]);
};
