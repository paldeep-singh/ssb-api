import { Schema, model, aws } from "dynamoose";
import { Item } from "dynamoose/dist/Item";

if (process.env.MOCK_DYNAMODB_ENDPOINT) {
  aws.ddb.local(process.env.MOCK_DYNAMODB_ENDPOINT);
}

interface adminUser {
  adminUserEmail: string;
  passwordHash: string;
}

const adminUserSchema = new Schema({
  adminUserEmail: {
    type: String,
    hashKey: true,
  },
  passwordHash: String,
});

interface adminUserItem extends Item, adminUser {}

const adminUserModel = model<adminUserItem>(
  "admin-users-table",
  adminUserSchema,
  {
    create: !!process.env.MOCK_DYNAMODB_ENDPOINT,
    waitForActive: false,
  }
);

const adminUserEmailExists = async (email: string) => {
  const response = await adminUserModel
    .query("adminUserEmail")
    .eq(email)
    .consistent()
    .count()
    .exec();

  return response.count !== 0;
};
