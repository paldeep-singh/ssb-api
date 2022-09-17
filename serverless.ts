import type { AWS } from "@serverless/typescript";
import adminUserFunctions from "@functions/adminUsers";

const serverlessConfiguration: AWS = {
  service: "ssb-api",
  plugins: [
    "serverless-esbuild",
    "serverless-dynamodb-local",
    "serverless-offline",
  ],
  frameworkVersion: "*",
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
    environment: {
      LOCAL_DYNAMODB_ENDPOINT: "http://localhost:8448",
    },
  },
  functions: {
    ...adminUserFunctions,
  },
  custom: {
    dynamodb: {
      stages: ["dev"],
      start: {
        docker: true,
        migrate: true,
        port: 8448,
        inMemory: true,
        convertEmptyValues: true,
        // Uncomment only if you already have a DynamoDB running locally,
        // noStart: true},
      },
      // TODO: Get seeds to work
      // seed: {
      //   dev: {
      //     sources: [
      //       {
      //         table: "admin-users-table",
      //         sources: [
      //           {
      //             email: "adminUser@ssb.com",
      //             passwordHash: "passwordHash",
      //           },
      //         ],
      //       },
      //     ],
      //   },
      // },
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
              AttributeName: "email",
              AttributeType: "S",
            },
          ],
          KeySchema: [
            {
              AttributeName: "email",
              KeyType: "HASH",
            },
          ],
          ProvisionedThroughput: {
            ReadCapacityUnits: 1,
            WriteCapacityUnits: 1,
          },
        },
      },
    },
  },
};

module.exports = serverlessConfiguration;
