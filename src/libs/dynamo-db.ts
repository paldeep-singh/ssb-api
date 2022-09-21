import { DeletionPolicy, Tag } from "./misc-aws-utils";

type AttributeDefinition = {
  AttributeName: string;
  AttributeType: "S" | "N" | "B" | "BOOL" | "M" | "L";
};

type ContributorInsightsSpecification = {
  Enabled: boolean;
};

type KeySchema = {
  AttributeName: string;
  KeyType: "HASH" | "RANGE";
};

type Projection = {
  ProjectionType?: "ALL" | "KEYS_ONLY" | "INCLUDE";
  NonKeyAttributes?: string[];
};

type ProvisionedThroughput = {
  ReadCapacityUnits: number;
  WriteCapacityUnits: number;
};

type GlobalSecondaryIndex = {
  ContributorInsightsSpecification: ContributorInsightsSpecification;
  IndexName: string;
  KeySchema: KeySchema[];
  Projection: Projection;
  ProvisionedThroughput?: ProvisionedThroughput;
};

type LocalSecondaryIndex = {
  IndexName: string;
  KeySchema: KeySchema[];
  Projection: Projection;
};

export type Table = {
  Type: "AWS::DynamoDB::Table";
  Properties: {
    TableName: string;
    AttributeDefinitions: AttributeDefinition[];
    BillingMode?: "PAY_PER_REQUEST" | "PROVISIONED";
    ContributorInsightsSpecification?: ContributorInsightsSpecification;
    GlobalSecondaryIndexes?: GlobalSecondaryIndex[];
    KeySchema: KeySchema[];
    LocalSecondaryIndexes?: LocalSecondaryIndex[];
    ProvisionedThroughput: ProvisionedThroughput;
    TableClass?: "STANDARD" | "STANDARD_INFREQUENT_ACCESS";
    Tags?: Tag[];
  };
  DeletionPolicy?: DeletionPolicy;
};
