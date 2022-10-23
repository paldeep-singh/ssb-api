import { Tag } from './misc-aws-utils'

type RecoveryOption = {
  Name: 'admin_only' | 'verified_email' | 'verified_phone_number'
  Priority: 1 | 2
}

type InviteMessageTemplate = {
  EmailMessage?: string
  EmailSubject?: string
  SMSMessage?: string
}

type SchemaAttribute = {
  AttributeDataType?: 'String' | 'Number' | 'DateTime' | 'Boolean'
  DeveloperOnlyAttribute?: boolean
  Mutable?: boolean
  Name: string
  NumberAttributeConstraints?: {
    MaxValue?: string
    MinValue?: string
  }
  Required?: boolean
  StringAttributeConstraints?: {
    MaxLength?: string
    MinLength?: string
  }
}

type VerificationMessageTemplate = {
  DefaultEmailOption?: 'CONFIRM_WITH_CODE' | 'CONFIRM_WITH_LINK'
  EmailMessage?: string
  EmailMessageByLink?: string
  EmailSubject?: string
  EmailSubjectByLink?: string
  SMSMessage?: string
}

type AdminCreateUserConfig = {
  AllowAdminCreateUserOnly?: boolean
  InviteMessageTemplate?: InviteMessageTemplate
  UnusedAccountValidityDays?: number
}

type DeviceConfiguration = {
  ChallengeRequiredOnNewDevice?: boolean
  DeviceOnlyRememberedOnUserPrompt?: boolean
}

type EmailConfiguration = {
  ConfigurationSet?: string
  EmailSendingAccount: 'COGNITO_DEFAULT' | 'DEVELOPER'
  From?: string
  ReplyToEmailAddress?: string
  SourceArn?: string
}

type LambdaConfig = {
  CreateAuthChallenge?: string
  CustomEmailSender?: {
    LambdaArn: string
    LambdaVersion: 'V1_0'
  }
  CustomMessage?: string
  CustomSMSSender?: {
    LambdaArn: string
    LambdaVersion: 'V1_0'
  }
  DefineAuthChallenge?: string
  PostAuthentication?: string
  PostConfirmation?: string
  PreAuthentication?: string
  PreSignUp?: string
  PreTokenGeneration?: string
  UserMigration?: string
  VerifyAuthChallengeResponse?: string
}

type PasswordPolicy = {
  MinimumLength?: number
  RequireLowercase?: boolean
  RequireNumbers?: boolean
  RequireSymbols?: boolean
  RequireUppercase?: boolean
  TemporaryPasswordValidityDays?: number
}

type SMSConfiguration = {
  ExternalId?: string
  SnsCallerArn?: string
  SnsRegion?: string
}

export type UserPool = {
  AccountRecoverySetting?: { RecoveryMechanisms: RecoveryOption[] }
  AdminCreateUserConfig?: AdminCreateUserConfig
  AliasAttributes?: Array<'email' | 'phone_number' | 'preferred_username'>
  AutoVerifiedAttributes?: Array<'email' | 'phone_number'>
  DeviceConfiguration?: DeviceConfiguration
  EmailConfiguration?: EmailConfiguration
  EnabledMfas?: Array<'SMS_MFA' | 'SOFTWARE_TOKEN_MFA'>
  LambdaConfig?: LambdaConfig
  MfaConfiguration?: 'OFF' | 'ON' | 'OPTIONAL'
  Policies?: {
    PasswordPolicy?: PasswordPolicy
  }
  Schema?: SchemaAttribute[]
  SMSAuthenticationMessage?: string
  SmsConfiguration?: SMSConfiguration
  UserAttributeUpdateSettings?: {
    AttributesRequireVerificationBeforeUpdate?: string[]
  }
  UsernameAttributes?: Array<'email' | 'phone_number'>
  UserNameConfiguration?: {
    CaseSensitive?: boolean
  }
  UserPoolAddOns?: {
    AdvancedSecurityMode?: 'AUDIT' | 'ENFORCED' | 'OFF'
  }
  UserPoolTags?: Tag[]
  VerificationMessageTemplate?: VerificationMessageTemplate
}
