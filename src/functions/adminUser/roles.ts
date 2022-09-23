import { Statement, createLambdaRole } from "@libs/iam";
import { ADMIN_USER_TABLE_REF, ADMIN_USER_PASSWORD_KEY_REF } from "./resources";

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

const updateAdminUserStatement: Statement = {
  Effect: "Allow",
  Action: ["dynamodb:UpdateItem"],
  Resource: adminUsersTableARN,
};

const encryptPasswordStatement: Statement = {
  Effect: "Allow",
  Action: ["kms:Encrypt"],
  Resource: [{ "Fn::GetAtt": [ADMIN_USER_PASSWORD_KEY_REF, "Arn"] }],
};

const adminUserExistsRole = createLambdaRole({
  statements: [queryAdminUsersStatement],
  roleName: "adminUserExistsRole",
  policyName: "adminUserExistsPolicy",
});

const adminUserPasswordIsSetRole = createLambdaRole({
  statements: [queryAdminUsersStatement],
  roleName: "adminUserPasswordIsSetRole",
  policyName: "adminUserPasswordIsSetPolicy",
});

const setAdminUserPasswordRole = createLambdaRole({
  statements: [
    encryptPasswordStatement,
    queryAdminUsersStatement,
    updateAdminUserStatement,
  ],
  roleName: "setAdminUserPasswordRole",
  policyName: "setAdminUserPasswordPolicy",
});

const adminUserRoles = {
  adminUserExistsRole,
  adminUserPasswordIsSetRole,
  setAdminUserPasswordRole,
};

export default adminUserRoles;
