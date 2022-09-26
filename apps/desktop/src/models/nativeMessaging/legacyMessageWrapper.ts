import { EncString } from "@bitwarden/common/models/domain";

import { LegacyMessage } from "./legacyMessage";

export type LegacyMessageWrapper = {
  message: LegacyMessage | EncString;
  appId: string;
};
