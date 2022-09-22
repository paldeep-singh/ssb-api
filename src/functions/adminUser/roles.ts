import { Statement, createLambdaRole } from "@libs/iam";
import { ADMIN_USER_TABLE_REF } from "./resources";

const adminUsersTableARN = [{ "Fn::GetAtt": [ADMIN_USER_TABLE_REF, "Arn"] }];

const queryAdminUsersStatement: Statement = {
  Effect: "Allow",
  Action: ["dynamodb:Query"],
  Resource: adminUsersTableARN,
};

const getAdminUserStatement: Statement = {
  Effect: "Allow",
  Action: ["dynamodb:GetItem"],
  Resource: adminUsersTableARN,
};

const adminUserExistsRole = createLambdaRole({
  statements: [queryAdminUsersStatement],
  roleName: "adminUserExistsRole",
  policyName: "adminUserExistsPolicy",
});

const adminUserPasswordIsSetRole = createLambdaRole({
  statements: [getAdminUserStatement],
  roleName: "adminUserPasswordIsSetRole",
  policyName: "adminUserPasswordIsSetPolicy",
});

const adminUserRoles = {
  adminUserExistsRole,
  adminUserPasswordIsSetRole,
};

export default adminUserRoles;
