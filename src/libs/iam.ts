import { AwsStrings, Tag } from './misc-aws-utils'

type Principal =
  | '*'
  | {
      AWS: AwsStrings
    }
  | {
      Service: AwsStrings
    }
  | {
      Federated: AwsStrings
    }

type Resource = AwsStrings

export type Statement = {
  Sid?: string
  Effect: 'Allow' | 'Deny'
  Action: string | string[]
  NotAction?: string | string[]
  Principal?: Principal
  NotPrincipal?: Principal
  Resource?: Resource | Resource[]
  NotResource?: Resource | Resource[]
  Condition?: {
    [key: string]: string
  }
}

export type PolicyDocument = {
  Version: '2012-10-17'
  Statement: Statement | Statement[]
}

type Policy = {
  PolicyName: string
  PolicyDocument: PolicyDocument
}

type iamRole = {
  Type: 'AWS::IAM::Role'
  Properties: {
    AssumeRolePolicyDocument: PolicyDocument
    Description?: string
    ManagedPolicyArns?: string[]
    MaxSessionDuration?: number
    Path?: string
    PermissionsBoundary?: string
    Policies?: Policy[]
    RoleName: string
    Tags?: Tag[]
  }
}

const lambdaAssumeRolePolicyDocument: PolicyDocument = {
  Version: '2012-10-17',
  Statement: {
    Effect: 'Allow',
    Action: 'sts:AssumeRole',
    Principal: {
      Service: 'lambda.amazonaws.com'
    }
  }
}

const lambdaBaseStatement: Statement = {
  Effect: 'Allow',
  Action: ['logs:CreateLogGroup', 'logs:CreateLogStream', 'logs:PutLogEvents'],
  Resource: [
    {
      'Fn::Sub':
        'arn:aws:logs:${AWS::Region}:${AWS::AccountId}:log-group:/aws/lambda/*'
    }
  ]
}

interface ICreateLambdaRole {
  statements: Statement[]
  roleName: string
  policyName: string
}

export const createLambdaRole = ({
  statements,
  roleName,
  policyName
}: ICreateLambdaRole): iamRole => {
  const role: iamRole = {
    Type: 'AWS::IAM::Role',
    Properties: {
      AssumeRolePolicyDocument: lambdaAssumeRolePolicyDocument,
      RoleName: roleName,
      Policies: [
        {
          PolicyName: policyName,
          PolicyDocument: {
            Version: '2012-10-17',
            Statement: [lambdaBaseStatement, ...statements]
          }
        }
      ]
    }
  }

  return role
}
