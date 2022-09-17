import { adminUserEmailInput } from "./schema";
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
  },
  adminUserPasswordIsSet: {
    handler: `${path}/handlers.handleCheckAdminUserPasswordIsSet`,
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
  },
};

export default adminUserFunctions;
