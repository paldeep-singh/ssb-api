import { PolicyDocument } from "./iam";
import { Tag, AwsStrings } from "./misc-aws-utils";

export const defaultKeyPolicy: PolicyDocument = {
  Version: "2012-10-17",
  Statement: {
    Sid: "Enable IAM policies",
    Effect: "Allow",
    Principal: {
      AWS: { "Fn::Sub": "arn:aws:iam::${AWS::AccountId}:root" },
    },
    Action: "kms:*",
    Resource: "*",
  },
};

export type KMSKey = {
  Type: "AWS::KMS::Key";
  Properties: {
    Description?: string;
    Enabled?: boolean;
    EnableKeyRotation?: boolean;
    KeyPolicy: PolicyDocument;
    KeySpec?:
      | "ECC_NIST_P256"
      | "ECC_NIST_P384"
      | "ECC_NIST_P521"
      | "ECC_SECG_P256K1"
      | "HMAC_224"
      | "HMAC_256"
      | "HMAC_384"
      | "HMAC_512"
      | "RSA_2048"
      | "RSA_3072"
      | "RSA_4096"
      | "SM2"
      | "SYMMETRIC_DEFAULT";
    KeyUsage?: "ENCRYPT_DECRYPT" | "SIGN_VERIFY" | "GENERATE_VERIFY_MAC";
    MultiRegion?: boolean;
    PendingWindowInDays?: number;
    Tags?: Tag[];
  };
};

export type KMSAlias = {
  Type: "AWS::KMS::Alias";
  Properties: {
    AliasName: AwsStrings;
    TargetKeyId: AwsStrings;
  };
};
