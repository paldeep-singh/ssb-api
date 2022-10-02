import { Schema, model, aws, transaction } from "dynamoose";
import { Item } from "dynamoose/dist/Item";
import { LOCAL_DYNAMODB_ENDPOINT } from "@libs/env";
import { VERIFICATION_CODE_TABLE_NAME } from "../resources";
import { ErrorCodes } from "../misc";
import { baseTableConfig } from "../misc";

export interface IVerificationCode {
  userId: string;
  codeHash: string;
  ttl: string;
}

export type IVerificationCodeVariables = Omit<IVerificationCode, "ttl">;

const verificationCodeSchema = new Schema({
  userId: {
    type: String,
    hashKey: true,
  },
  codeHash: String,
  codeSalt: String,
});

interface verificationCodeItem extends Item, IVerificationCode {}

export const verificationCodeModel = model<verificationCodeItem>(
  VERIFICATION_CODE_TABLE_NAME,
  verificationCodeSchema,
  {
    ...baseTableConfig,
    expires: {
      ttl: 1000 * 60 * 5, // 5 minutes
    },
  }
);

export const putVerificationCode = async ({
  userId,
  codeHash,
}: IVerificationCodeVariables) => {
  await verificationCodeModel.create({
    userId,
    codeHash,
  });
};

export const fetchVerificationCode = async (
  userId: string
): Promise<IVerificationCode> => {
  const verificationCode = await verificationCodeModel.get(userId);

  if (!verificationCode) {
    throw new Error(ErrorCodes.NO_ACTIVE_VERIFICATION_CODE);
  }

  return verificationCode;
};

export const deleteVerificationCode = async (email: string) => {
  await verificationCodeModel.delete(email);
};
