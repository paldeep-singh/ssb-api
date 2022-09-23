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

export const adminUserVerifyPasswordInput = {
  type: "object",
  properties: {
    email: { type: "string" },
    password: { type: "string" },
  },
  required: ["email", "password"],
} as const;
