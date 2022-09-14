import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "ssb-api",
  plugins: ["serverless-plugin-typescript", "serverless-offline"],
  frameworkVersion: "*",
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
  },
  functions: {
    hello: {
      handler: "src/index.handleHello",
      events: [
        {
          http: {
            method: "post",
            path: "hello",
          },
        },
      ],
    },
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
