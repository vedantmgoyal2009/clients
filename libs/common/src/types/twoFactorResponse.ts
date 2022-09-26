import {
  TwoFactorAuthenticatorResponse,
  TwoFactorDuoResponse,
  TwoFactorEmailResponse,
  TwoFactorRecoverResponse,
  TwoFactorWebAuthnResponse,
  TwoFactorYubiKeyResponse,
} from "../models/response";

export type TwoFactorResponse =
  | TwoFactorRecoverResponse
  | TwoFactorDuoResponse
  | TwoFactorEmailResponse
  | TwoFactorWebAuthnResponse
  | TwoFactorAuthenticatorResponse
  | TwoFactorYubiKeyResponse;
