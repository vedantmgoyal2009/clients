import { VerifyOTPRequest } from "@bitwarden/common/models/request";

export abstract class UserVerificationApiServiceAbstraction {
  postAccountVerifyOTP: (request: VerifyOTPRequest) => Promise<void>;
  postAccountRequestOTP: () => Promise<void>;
}
