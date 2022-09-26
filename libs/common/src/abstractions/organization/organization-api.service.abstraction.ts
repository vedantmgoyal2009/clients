import { OrganizationApiKeyType } from "../../enums/organizationApiKeyType";
import {
  ImportDirectoryRequest,
  OrganizationSsoRequest,
  OrganizationApiKeyRequest,
  OrganizationCreateRequest,
  OrganizationKeysRequest,
  OrganizationSubscriptionUpdateRequest,
  OrganizationTaxInfoUpdateRequest,
  OrganizationUpdateRequest,
  OrganizationUpgradeRequest,
  PaymentRequest,
  SeatRequest,
  SecretVerificationRequest,
  StorageRequest,
  VerifyBankRequest,
} from "../../models/request";
import {
  ApiKeyResponse,
  BillingResponse,
  ListResponse,
  OrganizationSsoResponse,
  OrganizationApiKeyInformationResponse,
  OrganizationAutoEnrollStatusResponse,
  OrganizationKeysResponse,
  OrganizationResponse,
  OrganizationSubscriptionResponse,
  PaymentResponse,
  TaxInfoResponse,
} from "../../models/response";

export class OrganizationApiServiceAbstraction {
  get: (id: string) => Promise<OrganizationResponse>;
  getBilling: (id: string) => Promise<BillingResponse>;
  getSubscription: (id: string) => Promise<OrganizationSubscriptionResponse>;
  getLicense: (id: string, installationId: string) => Promise<unknown>;
  getAutoEnrollStatus: (identifier: string) => Promise<OrganizationAutoEnrollStatusResponse>;
  create: (request: OrganizationCreateRequest) => Promise<OrganizationResponse>;
  createLicense: (data: FormData) => Promise<OrganizationResponse>;
  save: (id: string, request: OrganizationUpdateRequest) => Promise<OrganizationResponse>;
  updatePayment: (id: string, request: PaymentRequest) => Promise<void>;
  upgrade: (id: string, request: OrganizationUpgradeRequest) => Promise<PaymentResponse>;
  updateSubscription: (id: string, request: OrganizationSubscriptionUpdateRequest) => Promise<void>;
  updateSeats: (id: string, request: SeatRequest) => Promise<PaymentResponse>;
  updateStorage: (id: string, request: StorageRequest) => Promise<PaymentResponse>;
  verifyBank: (id: string, request: VerifyBankRequest) => Promise<void>;
  cancel: (id: string) => Promise<void>;
  reinstate: (id: string) => Promise<void>;
  leave: (id: string) => Promise<void>;
  delete: (id: string, request: SecretVerificationRequest) => Promise<void>;
  updateLicense: (id: string, data: FormData) => Promise<void>;
  importDirectory: (organizationId: string, request: ImportDirectoryRequest) => Promise<void>;
  getOrCreateApiKey: (id: string, request: OrganizationApiKeyRequest) => Promise<ApiKeyResponse>;
  getApiKeyInformation: (
    id: string,
    organizationApiKeyType?: OrganizationApiKeyType
  ) => Promise<ListResponse<OrganizationApiKeyInformationResponse>>;
  rotateApiKey: (id: string, request: OrganizationApiKeyRequest) => Promise<ApiKeyResponse>;
  getTaxInfo: (id: string) => Promise<TaxInfoResponse>;
  updateTaxInfo: (id: string, request: OrganizationTaxInfoUpdateRequest) => Promise<void>;
  getKeys: (id: string) => Promise<OrganizationKeysResponse>;
  updateKeys: (id: string, request: OrganizationKeysRequest) => Promise<OrganizationKeysResponse>;
  getSso: (id: string) => Promise<OrganizationSsoResponse>;
  updateSso: (id: string, request: OrganizationSsoRequest) => Promise<OrganizationSsoResponse>;
}
