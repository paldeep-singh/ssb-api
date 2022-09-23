import { Schema, model, aws, transaction } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { LOCAL_DYNAMODB_ENDPOINT } from "@libs/env";
import {
  ADMIN_USER_EMAIL_INDEX_NAME,
  ADMIN_USER_PASSWORD_KEY_ALIAS,
  ADMIN_USER_TABLE_NAME,
} from "./resources";
import { EncryptCommand } from "@aws-sdk/client-kms";
import { stringToUint8Array, Uint8ArrayToStr } from "@libs/kms";
import { kmsClient } from "@libs/kms";

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

export enum ErrorCodes {
  NON_EXISTENT_ADMIN_USER = "NON_EXISTENT_ADMIN_USER",
  PASSWORD_MISMATCH = "PASSWORD_MISMATCH",
  ENCRYPTION_FAILED = "ENCRYPTION_FAILED",
}

const queryAdminUserByEmail = (email: string) => {
  return adminUserModel.query("email").eq(email);
};

export const documentExists = async (email: string) => {
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
    throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);
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

export const verifyPassword = async (email: string, password: string) => {
  const [adminUser] = await queryAdminUserByEmail(email).exec();

  if (!adminUser) {
    throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);
  }

  const Plaintext = stringToUint8Array(password + adminUser.passwordSalt);

  const encrypt = new EncryptCommand({
    KeyId: ADMIN_USER_PASSWORD_KEY_ALIAS,
    Plaintext,
  });

  const { CiphertextBlob } = await kmsClient.send(encrypt);

  if (!CiphertextBlob) throw new Error(ErrorCodes.ENCRYPTION_FAILED);

  const encryptedPassword = Uint8ArrayToStr(CiphertextBlob);

  return encryptedPassword === adminUser.passwordHash;
};
