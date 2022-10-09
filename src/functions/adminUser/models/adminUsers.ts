import { model, Schema, transaction } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { ErrorCodes } from "../misc";
import {
  ADMIN_USER_EMAIL_INDEX_NAME,
  ADMIN_USER_TABLE_NAME,
} from "../resources";
import { baseTableConfig } from "../misc";

export interface IAdminUser {
  userId: string;
  email: string;
  passwordHash: string;
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
});

interface adminUserItem extends Item, IAdminUser {}

export const adminUserModel = model<adminUserItem>(
  ADMIN_USER_TABLE_NAME,
  adminUserSchema,
  baseTableConfig
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

  if (!adminUser) throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);

  return adminUser;
};

export const updatePassword = async ({
  email,
  newPasswordHash,
}: {
  email: string;
  newPasswordHash: string;
}) => {
  const [adminUser] = await queryAdminUserByEmail(email).exec();

  if (!adminUser) {
    throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);
  }

  const updateTransaction = adminUserModel.transaction.update(
    {
      userId: adminUser.userId,
    },
    {
      $SET: {
        passwordHash: newPasswordHash,
      },
    }
  );

  await transaction([updateTransaction]);
};
