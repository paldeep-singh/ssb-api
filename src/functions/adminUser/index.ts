import {
  adminUserEmailInput,
  adminUserLoginInput,
  adminUserSetPasswordInput,
  adminUserVerifyEmailInput,
} from "./schema";
import { handlerPath, handlerRoute } from "@libs/handler-resolver";
import { AWS } from "@serverless/typescript";

const path = handlerPath(__dirname);
const route = handlerRoute(__dirname);

const adminUserFunctions: AWS["functions"] = {
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
          path: `${route}/set-password`,
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
  sendAdminUserVerificationCode: {
    handler: `${path}/handlers.handleSendAdminUserVerificationCode`,
    events: [
      {
        http: {
          method: "post",
          path: `${route}/request-verification`,
          request: {
            schemas: {
              "application/json": adminUserEmailInput,
            },
          },
        },
      },
    ],
    role: "sendAdminUserVerificationCodeRole",
  },
  verifyAdminUserEmail: {
    handler: `${path}/handlers.handleVerifyAdminUserEmail`,
    events: [
      {
        http: {
          method: "post",
          path: `${route}/verify-email`,
          request: {
            schemas: {
              "application/json": adminUserVerifyEmailInput,
            },
          },
        },
      },
    ],
    role: "verifyAdminUserEmailRole",
  },
  login: {
    handler: `${path}/handlers.handleLogin`,
    events: [
      {
        http: {
          method: "post",
          path: `${route}/login`,
          request: {
            schemas: {
              "application/json": adminUserLoginInput,
            },
          },
        },
      },
    ],
    role: "adminUserLoginRole",
  },
};

export default adminUserFunctions;
