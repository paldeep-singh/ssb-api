export const adminUserEmailInput = {
  type: "object",
  properties: {
    email: { type: "string" },
  },
  required: ["email"],
} as const;
