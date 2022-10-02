import { Statement, createLambdaRole } from "@libs/iam";
import { ADMIN_USER_TABLE_REF, VERIFICATION_CODE_TABLE_REF } from "./resources";

const adminUsersTableARN = { "Fn::GetAtt": [ADMIN_USER_TABLE_REF, "Arn"] };
const verificationCodeTableARN = {
  "Fn::GetAtt": [VERIFICATION_CODE_TABLE_REF, "Arn"],
};
const queryAdminUsersStatement: Statement = {
  Effect: "Allow",
  Action: ["dynamodb:Query"],
  Resource: [
    adminUsersTableARN,
    { "Fn::Sub": "${AdminUsersTable.Arn}/index/*" },
  ],
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

const getVerificationCodeStatement: Statement = {
  Effect: "Allow",
  Action: ["dynamodb:GetItem"],
  Resource: verificationCodeTableARN,
};

const putVerificationCodeStatement: Statement = {
  Effect: "Allow",
  Action: ["dynamodb:PutItem"],
  Resource: verificationCodeTableARN,
};

const deleteVerificationCodeStatement: Statement = {
  Effect: "Allow",
  Action: ["dynamodb:DeleteItem"],
  Resource: verificationCodeTableARN,
};

const sendEmailStatement: Statement = {
  Effect: "Allow",
  Action: ["ses:SendEmail", "ses:SendRawEmail"],
  Resource: ["*"],
};

const adminUserExistsRole = createLambdaRole({
  statements: [queryAdminUsersStatement],
  roleName: "adminUserExistsRole",
  policyName: "adminUserExistsPolicy",
});

const adminUserAccountIsClaimedRole = createLambdaRole({
  statements: [queryAdminUsersStatement],
  roleName: "adminUserPasswordIsSetRole",
  policyName: "adminUserPasswordIsSetPolicy",
});

const setAdminUserPasswordRole = createLambdaRole({
  statements: [queryAdminUsersStatement, updateAdminUserStatement],
  roleName: "setAdminUserPasswordRole",
  policyName: "setAdminUserPasswordPolicy",
});

const sendAdminUserVerificationCodeRole = createLambdaRole({
  statements: [
    getVerificationCodeStatement,
    queryAdminUsersStatement,
    putVerificationCodeStatement,
    sendEmailStatement,
    deleteVerificationCodeStatement,
  ],
  roleName: "sendAdminUserVerificationCodeRole",
  policyName: "sendAdminUserVerificationCodePolicy",
});

const verifyAdminUserEmailRole = createLambdaRole({
  statements: [
    queryAdminUsersStatement,
    getVerificationCodeStatement,
    deleteVerificationCodeStatement,
  ],
  roleName: "verifyAdminUserEmailRole",
  policyName: "verifyAdminUserEmailPolicy",
});

const adminUserRoles = {
  adminUserExistsRole,
  adminUserAccountIsClaimedRole,
  setAdminUserPasswordRole,
  sendAdminUserVerificationCodeRole,
  verifyAdminUserEmailRole,
};

export default adminUserRoles;
