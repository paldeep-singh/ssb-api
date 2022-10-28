import type { AWS } from '@serverless/typescript'
import functions from '@functions/index'
import resources from '@functions/resources'
import roles from '@functions/roles'
import environment from 'src/env'

const stage = environment.STAGE
if (!stage) throw new Error('STAGE environment variable is not set')

const local = 'local'
const dynamoDbPort = 8448

const serverlessConfiguration: AWS = {
  service: 'ssb-api',
  plugins: [
    'serverless-esbuild',
    'serverless-dynamodb-local',
    'serverless-offline'
  ],
  frameworkVersion: '*',
  provider: {
    name: 'aws',
    stage,
    runtime: 'nodejs16.x',
    region: 'ap-southeast-2',
    environment: {
      STAGE: stage
    }
  },
  functions,
  custom: {
    esbuild: {
      bundle: true,
      minify: false,
      sourcemap: true,
      exclude: ['aws-sdk'],
      target: 'node16',
      define: { 'require.resolve': undefined },
      platform: 'node',
      concurrency: 10
    },
    dynamodb: {
      stages: [local],
      start: {
        docker: true,
        migrate: true,
        port: dynamoDbPort,
        inMemory: true,
        convertEmptyValues: true
        // Uncomment only if you already have a DynamoDB running locally,
        // noStart: true},
      }
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
    }
  },
  resources: {
    Resources: {
      ...resources,
      ...roles
    }
  }
}

module.exports = serverlessConfiguration
