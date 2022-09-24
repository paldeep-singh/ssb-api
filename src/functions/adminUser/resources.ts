import { Table } from "@libs/dynamo-db";
import { STAGE } from "@libs/env";
import { defaultKeyPolicy, KMSAlias, KMSKey } from "@libs/kms";

export const ADMIN_USER_TABLE_NAME = `${STAGE}-admin-users-table`;
export const ADMIN_USER_TABLE_REF = "AdminUsersTable";
export const ADMIN_USER_EMAIL_INDEX_NAME = "email-index";

export const VERIFICATION_CODE_TABLE_NAME = `${STAGE}-admin-users-verification-code-table`;
export const VERIFICATION_CODE_TABLE_REF = "AdminUsersVerificationCodeTable";

export const ADMIN_USER_PASSWORD_KEY_ALIAS = `alias/${STAGE}-admin-user-password-key`;
export const ADMIN_USER_PASSWORD_KEY_REF = "AdminUserPasswordKey";

export const ADMIN_USER_VERIFICATION_CODE_KEY_ALIAS = `alias/${STAGE}-admin-user-verification-code-key`;
export const ADMIN_USER_VERIFICATION_CODE_KEY_REF =
  "AdminUserVerificationCodeKey";

const AdminUsersTable: Table = {
  Type: "AWS::DynamoDB::Table",
  Properties: {
    TableName: ADMIN_USER_TABLE_NAME,
    AttributeDefinitions: [
      {
        AttributeName: "userId",
        AttributeType: "S",
      },
      {
        AttributeName: "email",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "userId",
        KeyType: "HASH",
      },
    ],
    GlobalSecondaryIndexes: [
      {
        IndexName: ADMIN_USER_EMAIL_INDEX_NAME,
        KeySchema: [
          {
            AttributeName: "email",
            KeyType: "HASH",
          },
        ],
        Projection: {
          ProjectionType: "ALL",
        },
        ProvisionedThroughput: {
          ReadCapacityUnits: 1,
          WriteCapacityUnits: 1,
        },
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  },
  // Change this in permanent deployment
  DeletionPolicy: "Delete",
};

const AdminUsersVerificationCodeTable: Table = {
  Type: "AWS::DynamoDB::Table",
  Properties: {
    TableName: VERIFICATION_CODE_TABLE_NAME,
    AttributeDefinitions: [
      {
        AttributeName: "userId",
        AttributeType: "S",
      },
    ],
    KeySchema: [
      {
        AttributeName: "userId",
        KeyType: "HASH",
      },
    ],
    ProvisionedThroughput: {
      ReadCapacityUnits: 1,
      WriteCapacityUnits: 1,
    },
  },
  // Change this in permanent deployment
  DeletionPolicy: "Delete",
};

const AdminUserPasswordKey: KMSKey = {
  Type: "AWS::KMS::Key",
  Properties: {
    Description: "Admin user password key",
    KeyPolicy: defaultKeyPolicy,
  },
};

const AdminUserPasswordKeyAliasResource: KMSAlias = {
  Type: "AWS::KMS::Alias",
  Properties: {
    AliasName: ADMIN_USER_PASSWORD_KEY_ALIAS,
    TargetKeyId: { Ref: ADMIN_USER_PASSWORD_KEY_REF },
  },
};

const AdminUserVerificationCodeKey: KMSKey = {
  Type: "AWS::KMS::Key",
  Properties: {
    Description: "Admin user verification code key",
    KeyPolicy: defaultKeyPolicy,
  },
};

const AdminUserVerificationCodeKeyAliasResource: KMSAlias = {
  Type: "AWS::KMS::Alias",
  Properties: {
    AliasName: ADMIN_USER_VERIFICATION_CODE_KEY_ALIAS,
    TargetKeyId: { Ref: ADMIN_USER_VERIFICATION_CODE_KEY_REF },
  },
};

const adminUserResources = {
  AdminUsersTable,
  AdminUserPasswordKey,
  AdminUserPasswordKeyAliasResource,
  AdminUsersVerificationCodeTable,
  AdminUserVerificationCodeKey,
  AdminUserVerificationCodeKeyAliasResource,
};

export default adminUserResources;
