import { SecretVerificationRequest } from "@bitwarden/common/models/request";

export abstract class AccountApiService {
  abstract deleteAccount(request: SecretVerificationRequest): Promise<void>;
}
