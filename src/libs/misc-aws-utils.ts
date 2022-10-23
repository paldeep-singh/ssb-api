import { AwsCfRef } from '@serverless/typescript'

type AwsCfImport = {
  'Fn::ImportValue': string | AwsCfFunction
}

type AwsCfJoin = {
  'Fn::Join': [string, Array<string | AwsCfFunction>]
}

type AwsCfGetAtt = {
  'Fn::GetAtt': string[]
}

interface AwsCfSub {
  'Fn::Sub': string | [string, { [key: string]: string | AwsCfFunction }]
}

type AwsCfFunction = AwsCfImport | AwsCfJoin | AwsCfGetAtt | AwsCfRef | AwsCfSub

export type AwsStrings = string | AwsCfFunction | Array<string | AwsCfFunction>

export type Tag = {
  Key: string
  Value: string
}

export type DeletionPolicy = 'Delete' | 'Retain' | 'Snapshot'
