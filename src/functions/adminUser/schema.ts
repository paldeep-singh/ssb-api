export interface IAdminUserEmailInput {
  email: string
}

export const adminUserEmailInput = {
  type: 'object',
  properties: {
    email: { type: 'string' }
  },
  required: ['email']
} as const

export interface IAdminUserSetPasswordInput {
  newPassword: string
  confirmNewPassword: string
}

export const adminUserSetPasswordInput = {
  type: 'object',
  properties: {
    newPassword: { type: 'string' },
    confirmNewPassword: { type: 'string' }
  },
  required: ['newPassword', 'confirmNewPassword']
} as const

export interface IAdminUserLoginInput {
  email: string
  password: string
}

export const adminUserLoginInput = {
  type: 'object',
  properties: {
    email: { type: 'string' },
    password: { type: 'string' }
  },
  required: ['email', 'password']
} as const

export interface IAdminUserVerifyEmailInput {
  email: string
  verificationCode: string
}

export const adminUserVerifyEmailInput = {
  type: 'object',
  properties: {
    email: { type: 'string' },
    verificationCode: { type: 'string' }
  },
  required: ['email', 'verificationCode']
} as const
