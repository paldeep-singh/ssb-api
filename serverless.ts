import type { AWS } from "@serverless/typescript";
import functions from "@functions/index";
import Resources from "@functions/resources";

const stage = process.env.SLS_STAGE ?? "dev";
const local = "local";
const localStage = stage === "local";
const dynamoDbPort = 8448;
console.log(stage);
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
    stage,
    runtime: "nodejs16.x",
    region: "ap-southeast-2",
    environment: {
      ...(localStage && {
        LOCAL_DYNAMODB_ENDPOINT: `http://localhost:${dynamoDbPort}`,
      }),
    },
  },
  functions,
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ["aws-sdk"],
      target: "node16",
      define: { "require.resolve": undefined },
      platform: "node",
      concurrency: 10,
    },
    dynamodb: {
      stages: [local],
      start: {
        docker: true,
        migrate: true,
        port: dynamoDbPort,
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
    Resources,
  },
};

module.exports = serverlessConfiguration;
