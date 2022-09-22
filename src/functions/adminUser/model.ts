import { Schema, model, aws } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { LOCAL_DYNAMODB_ENDPOINT } from "@libs/env";
import {
  ADMIN_USER_EMAIL_INDEX_NAME,
  ADMIN_USER_PASSWORD_KEY_ALIAS,
  ADMIN_USER_TABLE_NAME,
} from "./resources";
import { KMSClient, EncryptCommand } from "@aws-sdk/client-kms";
import { stringToUint8Array, Uint8ArrayToStr } from "@libs/kms";
import { randomBytes } from "crypto";

let kmsClient: KMSClient;

if (LOCAL_DYNAMODB_ENDPOINT) {
  const localDDB = new aws.ddb.DynamoDB({
    region: "local",
    endpoint: LOCAL_DYNAMODB_ENDPOINT,
  });

  aws.ddb.set(localDDB);

  kmsClient = new KMSClient({
    region: "local",
  });
} else {
  kmsClient = new KMSClient({});
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

export const userPasswordIsSet = async (email: string) => {
  const [adminUser] = await queryAdminUserByEmail(email).exec();

  if (!adminUser) throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);

  return !!adminUser.passwordHash;
};

export const setPassword = async ({
  email,
  newPassword,
}: {
  email: string;
  newPassword: string;
}) => {
  const [adminUser] = await queryAdminUserByEmail(email).exec();

  if (!adminUser) {
    throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);
  }

  const salt = randomBytes(256).toString();

  const Plaintext = stringToUint8Array(newPassword + salt);

  const encrypt = new EncryptCommand({
    KeyId: ADMIN_USER_PASSWORD_KEY_ALIAS,
    Plaintext,
  });

  const { CiphertextBlob } = await kmsClient.send(encrypt);

  if (!CiphertextBlob) throw new Error(ErrorCodes.ENCRYPTION_FAILED);

  adminUser.passwordHash = Uint8ArrayToStr(CiphertextBlob);
  adminUser.passwordSalt = salt;

  await adminUser.save();
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
