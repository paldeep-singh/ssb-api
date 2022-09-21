import { Statement, createLambdaRole } from "@libs/iam";
import { ADMIN_USERS_TABLE_NAME } from "./model";

const adminUsersTableARN = [{ "Fn::GetAtt": ["AdminUsersTable", "Arn"] }];

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
