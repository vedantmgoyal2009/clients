import { ServerConfigResponse } from "@bitwarden/common/models/response";

export abstract class ConfigApiServiceAbstraction {
  get: () => Promise<ServerConfigResponse>;
}
