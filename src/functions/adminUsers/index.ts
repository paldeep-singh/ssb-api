import schema from "./schema";
import { handlerPath } from "@libs/handler-resolver";
import { AWS } from "@serverless/typescript";

const adminUserFunctions: AWS["functions"] = {
  adminUserExists: {
    handler: `${handlerPath(__dirname)}/handler.handleCheckAdminUserExists`,
    events: [
      {
        http: {
          method: "post",
          path: "admin-users/exists",
          request: {
            schemas: {
              "application/json": schema,
            },
          },
        },
      },
    ],
  },
};

export default adminUserFunctions;
