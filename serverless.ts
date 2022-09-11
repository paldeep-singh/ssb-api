import type { AWS } from "@serverless/typescript";

const serverlessConfiguration: AWS = {
  service: "ssb-api",
  plugins: ["serverless-plugin-typescript"],
  frameworkVersion: "*",
  provider: {
    name: "aws",
    runtime: "nodejs16.x",
  },
  functions: {
    hello: {
      handler: "handler.hello",
      events: [
        {
          http: {
            method: "get",
            path: "hello",
          },
        },
      ],
    },
  },
};

module.exports = serverlessConfiguration;
