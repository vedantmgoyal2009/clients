import { SendType } from "@bitwarden/common/enums/sendType";
import { SendView } from "@bitwarden/common/models/view";

import { BrowserComponentState } from "./browserComponentState";

export class BrowserSendComponentState extends BrowserComponentState {
  sends: SendView[];
  typeCounts: Map<SendType, number>;
}
