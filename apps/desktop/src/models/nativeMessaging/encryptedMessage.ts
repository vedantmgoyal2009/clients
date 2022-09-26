import { EncString } from "@bitwarden/common/models/domain";

import { MessageCommon } from "./messageCommon";

export type EncryptedMessage = MessageCommon & {
  // Will decrypt to a DecryptedCommandData object
  encryptedCommand: EncString;
};
