import { SendTextData } from "../data";
import { SendTextView } from "../view";

import { Domain } from "./domain-base";
import { EncString } from "./enc-string";
import { SymmetricCryptoKey } from "./symmetric-crypto-key";

export class SendText extends Domain {
  text: EncString;
  hidden: boolean;

  constructor(obj?: SendTextData) {
    super();
    if (obj == null) {
      return;
    }

    this.hidden = obj.hidden;
    this.buildDomainModel(
      this,
      obj,
      {
        text: null,
      },
      []
    );
  }

  decrypt(key: SymmetricCryptoKey): Promise<SendTextView> {
    return this.decryptObj(
      new SendTextView(this),
      {
        text: null,
      },
      null,
      key
    );
  }
}
