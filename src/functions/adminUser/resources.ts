import { Table } from "@libs/dynamo-db";
import { defaultKeyPolicy, KMSAlias, KMSKey } from "@libs/kms";

const AdminUsersTable: Table = {
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
    AliasName: "alias/admin-user-password-key",
    TargetKeyId: { Ref: "AdminUserPasswordKey" },
  },
};

const adminUserResources = {
  AdminUsersTable,
  AdminUserPasswordKey,
  AdminUserPasswordKeyAliasResource,
};

export default adminUserResources;
