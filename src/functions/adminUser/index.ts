import { adminUserEmailInput, adminUserSetPasswordInput } from "./schema";
import { handlerPath, handlerRoute } from "@libs/handler-resolver";
import { AWS } from "@serverless/typescript";

const path = handlerPath(__dirname);
const route = handlerRoute(__dirname);

const adminUserFunctions: AWS["functions"] = {
  adminUserExists: {
    handler: `${path}/handlers.handleCheckAdminUserExists`,
    events: [
      {
        http: {
          method: "post",
          path: `${route}/exists`,
          request: {
            schemas: {
              "application/json": adminUserEmailInput,
            },
          },
        },
      },
    ],
    role: "adminUserExistsRole",
  },
  adminUserAccountIsClaimed: {
    handler: `${path}/handlers.handleCheckAdminUserAccountIsClaimed`,
    events: [
      {
        http: {
          method: "post",
          path: `${route}/claimed`,
          request: {
            schemas: {
              "application/json": adminUserEmailInput,
            },
          },
        },
      },
    ],
    role: "adminUserAccountIsClaimedRole",
  },
  setAdminUserPassword: {
    handler: `${path}/handlers.handleSetAdminUserPassword`,
    events: [
      {
        http: {
          method: "post",
          path: `${route}/password/set`,
          request: {
            schemas: {
              "application/json": adminUserSetPasswordInput,
            },
          },
        },
      },
    ],
    role: "setAdminUserPasswordRole",
  },
};

export default adminUserFunctions;
