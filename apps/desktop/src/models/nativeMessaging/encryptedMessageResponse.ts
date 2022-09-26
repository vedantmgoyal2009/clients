import { EncString } from "@bitwarden/common/models/domain";

import { MessageCommon } from "./messageCommon";

export type EncryptedMessageResponse = MessageCommon & {
  encryptedPayload: EncString;
};
