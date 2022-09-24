import { Schema, model, aws, transaction } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { LOCAL_DYNAMODB_ENDPOINT } from "@libs/env";
import {
  ADMIN_USER_EMAIL_INDEX_NAME,
  ADMIN_USER_PASSWORD_KEY_ALIAS,
  ADMIN_USER_TABLE_NAME,
  VERIFICATION_CODE_TABLE_NAME,
} from "./resources";
import { Codes } from "./Error";

if (LOCAL_DYNAMODB_ENDPOINT) {
  const localDDB = new aws.ddb.DynamoDB({
    region: "local",
    endpoint: LOCAL_DYNAMODB_ENDPOINT,
  });

  aws.ddb.set(localDDB);
}

const baseTableConfig = {
  create: !!LOCAL_DYNAMODB_ENDPOINT,
  waitForActive: !!LOCAL_DYNAMODB_ENDPOINT,
};

export interface IAdminUser {
  userId: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
}

export interface IVerificationCode {
  userId: string;
  codeHash: string;
  codeSalt: string;
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

const verificationCodeSchema = new Schema({
  userId: {
    type: String,
    hashKey: true,
  },
  codeHash: String,
  codeSalt: String,
});

interface adminUserItem extends Item, IAdminUser {}

interface verificationCodeItem extends Item, IVerificationCode {}

export const adminUserModel = model<adminUserItem>(
  ADMIN_USER_TABLE_NAME,
  adminUserSchema,
  baseTableConfig
);

export const verificationCodeModel = model<verificationCodeItem>(
  VERIFICATION_CODE_TABLE_NAME,
  verificationCodeSchema,
  {
    ...baseTableConfig,
    expires: {
      ttl: 60 * 10, // 5 minutes
    },
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

export const putVerificationCode = async ({
  userId,
  codeHash,
  codeSalt,
}: IVerificationCode) => {
  await verificationCodeModel.create({
    userId,
    codeHash,
    codeSalt,
  });
};

export const fetchVerificationCode = async (
  userId: string
): Promise<IVerificationCode | undefined> => {
  const verificationCode = await verificationCodeModel.get(userId);

  return verificationCode;
};

export const deleteVerificationCode = async (email: string) => {
  await verificationCodeModel.delete(email);
};
