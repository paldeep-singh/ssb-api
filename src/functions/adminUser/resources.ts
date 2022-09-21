import { Table } from "@libs/dynamo-db";

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

const adminUserResources = {
  AdminUsersTable,
};

export default adminUserResources;
