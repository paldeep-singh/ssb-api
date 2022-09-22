import { Table } from "@libs/dynamo-db";
import { STAGE } from "@libs/env";
import { defaultKeyPolicy, KMSAlias, KMSKey } from "@libs/kms";

export const ADMIN_USER_TABLE_NAME = `${STAGE}-admin-users-table`;
export const ADMIN_USER_PASSWORD_KEY_ALIAS = `${STAGE}-admin-user-password-key`;
export const ADMIN_USER_TABLE_REF = "AdminUsersTable";

const AdminUsersTable: Table = {
  Type: "AWS::DynamoDB::Table",

  Properties: {
    TableName: ADMIN_USER_TABLE_NAME,
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
    AliasName: `alias/${ADMIN_USER_PASSWORD_KEY_ALIAS}`,
    TargetKeyId: { Ref: "AdminUserPasswordKey" },
  },
};

const adminUserResources = {
  AdminUsersTable,
  AdminUserPasswordKey,
  AdminUserPasswordKeyAliasResource,
};

export default adminUserResources;
