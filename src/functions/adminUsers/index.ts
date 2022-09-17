import { adminUserEmailInput } from "./schema";
import { handlerPath } from "@libs/handler-resolver";
import { AWS } from "@serverless/typescript";

const adminUserFunctions: AWS["functions"] = {
  adminUserExists: {
    handler: `${handlerPath(__dirname)}/handlers.handleCheckAdminUserExists`,
    events: [
      {
        http: {
          method: "post",
          path: `admin-users/exists`,
          request: {
            schemas: {
              "application/json": adminUserEmailInput,
            },
          },
        },
      },
    ],
  },
  adminUserPasswordIsSet: {
    handler: `${handlerPath(
      __dirname
    )}/handlers.handleCheckAdminUserPasswordIsSet`,
    events: [
      {
        http: {
          method: "post",
          path: "admin-users/claimed",
          request: {
            schemas: {
              "application/json": adminUserEmailInput,
            },
          },
        },
      },
    ],
  },
};

export default adminUserFunctions;
