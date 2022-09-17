import { Schema, model, aws } from "dynamoose";
import { Item } from "dynamoose/dist/Item";

if (process.env.MOCK_DYNAMODB_ENDPOINT) {
  const localDDB = new aws.ddb.DynamoDB({
    region: "local",
    endpoint: process.env.MOCK_DYNAMODB_ENDPOINT,
  });

  aws.ddb.set(localDDB);
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
  "admin-users-table",
  adminUserSchema,
  {
    create: !!process.env.MOCK_DYNAMODB_ENDPOINT,
    waitForActive: !!process.env.MOCK_DYNAMODB_ENDPOINT,
  }
);

export const adminUserExists = async (email: string) => {
  console.log(email);

  try {
    const response = await adminUserModel
      .query("email")
      .eq(email)
      .consistent()
      .count()
      .exec();

    return response.count !== 0;
  } catch (error) {
    console.log(error);
    throw error;
  }
};
