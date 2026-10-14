// Components
export { AuthLayoutWrapper } from './components/AuthLayoutWrapper';
export type { AuthLayoutWrapperProps, BackNavigationConfig } from './components/AuthLayoutWrapper';

export { AuthFormField } from './components/AuthFormField';
export type { AuthFormFieldProps } from './components/AuthFormField';

export { PasswordField } from './components/PasswordField';
export type { PasswordFieldProps } from './components/PasswordField';

export { OtpInputField } from './components/OtpInputField';
export type { OtpInputFieldProps } from './components/OtpInputField';

export { OtpVerificationForm } from './components/OtpVerificationForm';
export type { OtpVerificationFormProps } from './components/OtpVerificationForm';

export { LoginForm } from './components/LoginForm';
export type { LoginFormProps } from './components/LoginForm';

export { ForgotPasswordForm } from './components/ForgotPasswordForm';
export type { ForgotPasswordFormProps } from './components/ForgotPasswordForm';

export { ResetPasswordForm } from './components/ResetPasswordForm';
export type { ResetPasswordFormProps } from './components/ResetPasswordForm';

// Schemas
export {
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './schemas/auth.schema';

// Types
export type {
  LoginFormData,
  VerifyOtpFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  LoginStep,
  FormErrors,
  SafeUser,
  LoginRequestPayload,
  VerifyLoginOtpRequestPayload,
  VerifyEmailRequestPayload,
  ForgotPasswordRequestPayload,
  ResetPasswordRequestPayload,
  LoginChallengeResponse,
  TokenPairResponse,
  ApiResponse,
} from './types';

// Utilities
export { EMAIL_REGEX, STRONG_PASSWORD_REGEX, OTP_REGEX } from './utils/regex.util';
export { extractZodErrors } from './utils/auth-error.util';
