import { SecureNoteType } from "../../enums/secureNoteType";
import { SecureNoteData } from "../data";
import { SecureNoteView } from "../view";

import { Domain } from "./domain-base";
import { SymmetricCryptoKey } from "./symmetric-crypto-key";

export class SecureNote extends Domain {
  type: SecureNoteType;

  constructor(obj?: SecureNoteData) {
    super();
    if (obj == null) {
      return;
    }

    this.type = obj.type;
  }

  decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<SecureNoteView> {
    return Promise.resolve(new SecureNoteView(this));
  }

  toSecureNoteData(): SecureNoteData {
    const n = new SecureNoteData();
    n.type = this.type;
    return n;
  }
}
