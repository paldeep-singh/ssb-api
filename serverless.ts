import type { AWS } from "@serverless/typescript";
import adminUserFunctions from "@functions/adminUsers";

const serverlessConfiguration: AWS = {
  service: "ssb-api",
  plugins: ["serverless-plugin-typescript", "serverless-offline"],
  frameworkVersion: "*",
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
  },
  functions: {
    ...adminUserFunctions,
  },
  resources: {
    Resources: {
      AdminUsersTable: {
        Type: "AWS::DynamoDB::Table",

        Properties: {
          TableName: "admin-users-table",
          AttributeDefinitions: [
            {
              AttributeName: "adminUserId",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "adminUserId",
              KeyType: "HASH",
            },
          ],
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
