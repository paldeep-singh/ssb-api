import { Schema, model, aws } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { LOCAL_DYNAMODB_ENDPOINT } from "@libs/env";
import {
  ADMIN_USER_PASSWORD_KEY_ALIAS,
  ADMIN_USER_TABLE_NAME,
} from "./resources";
import { KMSClient, EncryptCommand } from "@aws-sdk/client-kms";
import { stringToUint8Array, Uint8ArrayToStr } from "@libs/kms";

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

export const documentExists = async (email: string) => {
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

export const userPasswordIsSet = async (email: string) => {
  const adminUser = await adminUserModel.get(email);

  if (!adminUser) throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);

  return !!adminUser.passwordHash;
};

export const setUserPassword = async ({
  email,
  newPassword,
  confirmNewPassword,
}: {
  email: string;
  newPassword: string;
  confirmNewPassword: string;
}) => {
  if (newPassword !== confirmNewPassword) {
    throw new Error(ErrorCodes.PASSWORD_MISMATCH);
  }

  const adminUser = await adminUserModel.get(email);

  if (!adminUser) {
    throw new Error(ErrorCodes.NON_EXISTENT_ADMIN_USER);
  }

  const Plaintext = stringToUint8Array(newPassword);

  const encrypt = new EncryptCommand({
    KeyId: ADMIN_USER_PASSWORD_KEY_ALIAS,
    Plaintext,
  });

  const { CiphertextBlob } = await kmsClient.send(encrypt);

  if (!CiphertextBlob) throw new Error(ErrorCodes.ENCRYPTION_FAILED);

  adminUser.passwordHash = Uint8ArrayToStr(CiphertextBlob);

  await adminUser.save();
};
