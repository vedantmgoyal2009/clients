import { AuthenticationStatus } from "../enums/authenticationStatus";
import {
  AuthResult,
  ApiLogInCredentials,
  PasswordLogInCredentials,
  SsoLogInCredentials,
  SymmetricCryptoKey,
} from "../models/domain";
import { TokenRequestTwoFactor } from "../models/request";

export abstract class AuthService {
  masterPasswordHash: string;
  email: string;
  logIn: (
    credentials: ApiLogInCredentials | PasswordLogInCredentials | SsoLogInCredentials
  ) => Promise<AuthResult>;
  logInTwoFactor: (
    twoFactor: TokenRequestTwoFactor,
    captchaResponse: string
  ) => Promise<AuthResult>;
  logOut: (callback: () => void) => void;
  makePreloginKey: (masterPassword: string, email: string) => Promise<SymmetricCryptoKey>;
  authingWithApiKey: () => boolean;
  authingWithSso: () => boolean;
  authingWithPassword: () => boolean;
  getAuthStatus: (userId?: string) => Promise<AuthenticationStatus>;
}
