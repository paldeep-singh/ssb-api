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
};

module.exports = serverlessConfiguration;
