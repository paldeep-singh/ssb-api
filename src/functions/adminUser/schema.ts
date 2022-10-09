export const adminUserEmailInput = {
  type: "object",
  properties: {
    email: { type: "string" },
  },
  required: ["email"],
} as const;

export const adminUserSetPasswordInput = {
  type: "object",
  properties: {
    email: { type: "string" },
    newPassword: { type: "string" },
    confirmNewPassword: { type: "string" },
  },
  required: ["email", "newPassword", "confirmNewPassword"],
} as const;

export const adminUserLoginInput = {
  type: "object",
  properties: {
    email: { type: "string" },
    password: { type: "string" },
  },
  required: ["email", "password"],
} as const;

export const adminUserVerifyEmailInput = {
  type: "object",
  properties: {
    email: { type: "string" },
    verificationCode: { type: "string" },
  },
  required: ["email", "verificationCode"],
} as const;
