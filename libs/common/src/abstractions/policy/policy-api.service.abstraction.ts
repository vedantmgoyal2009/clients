import { PolicyType } from "@bitwarden/common/enums/policyType";
import { MasterPasswordPolicyOptions, Policy } from "@bitwarden/common/models/domain";
import { PolicyRequest } from "@bitwarden/common/models/request";
import { ListResponse, PolicyResponse } from "@bitwarden/common/models/response";

export class PolicyApiServiceAbstraction {
  getPolicy: (organizationId: string, type: PolicyType) => Promise<PolicyResponse>;
  getPolicies: (organizationId: string) => Promise<ListResponse<PolicyResponse>>;
  getPoliciesByToken: (
    organizationId: string,
    token: string,
    email: string,
    organizationUserId: string
  ) => Promise<ListResponse<PolicyResponse>>;
  getPoliciesByInvitedUser: (
    organizationId: string,
    userId: string
  ) => Promise<ListResponse<PolicyResponse>>;
  getPolicyForOrganization: (policyType: PolicyType, organizationId: string) => Promise<Policy>;
  getMasterPasswordPoliciesForInvitedUsers: (orgId: string) => Promise<MasterPasswordPolicyOptions>;
  putPolicy: (organizationId: string, type: PolicyType, request: PolicyRequest) => Promise<any>;
}
