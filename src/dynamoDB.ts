import { Schema, model, aws } from "dynamoose";
import { Item } from "dynamoose/dist/Item";

const localDynamoDBEndpoint = process.env.LOCAL_DYNAMODB_ENDPOINT;

console.log(localDynamoDBEndpoint);

if (localDynamoDBEndpoint) {
  const localDDB = new aws.ddb.DynamoDB({
    region: "local",
    endpoint: localDynamoDBEndpoint,
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
    create: !!localDynamoDBEndpoint,
    waitForActive: !!localDynamoDBEndpoint,
  }
);

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
    console.log("printed error", error);
    throw error;
  }
};
