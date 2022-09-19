export type Principal =
  | "*"
  | {
      Service?: string;
      AWS?: string;
      Federated?: string;
    };

export type PolicyDocument = {
  Version: "2012-10-17";
  Statement: {
    Effect: "Allow" | "Deny";
    Action: string | string[];
    NotAction?: string | string[];
    Principal?: Principal;
    NotPrincipal?: Principal;
    Resource?: string | string[];
    NotResource?: string | string[];
    Condition?: {
      [key: string]: string;
    };
  };
};

export type Policy = {
  PolicyName: string;
  PolicyDocument: PolicyDocument;
};

export type iamRole = {
  Type: "AWS::IAM::Role";
  Properties: {
    AssumeRolePolicyDocument: PolicyDocument;
    Description?: string;
    ManagedPolicyArns?: string[];
    MaxSessionDuration?: number;
    Path?: string;
    PermissionsBoundary?: string;
    Policies?: Policy[];
    RoleName: string;
    Tags?: {
      Key: string;
      Value: string;
    };
  };
};

export const createAssumeRolePolicyDocument = (Principal: Principal) => ({
  Version: "2012-10-17",
  Statement: {
    Effect: "Allow",
    Action: "sts:AssumeRole",
    Principal,
  },
});
