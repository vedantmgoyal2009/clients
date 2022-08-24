import { Jsonify } from "type-fest";

import { CipherData } from "../models/data/cipherData";
import { LocalData } from "../models/data/localData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

export type WebWorkerRequest = DecryptCipherRequest;

export class DecryptCipherRequest {
  readonly type = "decryptCiphers";
  orgKeys: { [orgId: string]: SymmetricCryptoKey } = {};

  constructor(
    public id: string,
    public cipherData: { [id: string]: CipherData },
    public localData: { [cipherId: string]: LocalData },
    public userKey: SymmetricCryptoKey,
    orgKeys: Map<string, SymmetricCryptoKey> | { [orgId: string]: SymmetricCryptoKey }
  ) {
    if (orgKeys == null) {
      return;
    } else if (orgKeys instanceof Map) {
      orgKeys.forEach((key, orgId) => (this.orgKeys[orgId] = key));
    } else {
      this.orgKeys = orgKeys;
    }
  }

  static fromJSON(obj: Jsonify<DecryptCipherRequest>): DecryptCipherRequest {
    const userKey = obj.userKey == null ? null : SymmetricCryptoKey.fromJSON(obj.userKey);
    const orgKeys: { [orgId: string]: SymmetricCryptoKey } = {};
    if (obj.orgKeys != null) {
      for (const [orgId, key] of Object.entries(obj.orgKeys)) {
        orgKeys[orgId] = SymmetricCryptoKey.fromJSON(key);
      }
    }

    return new DecryptCipherRequest(obj.id, obj.cipherData, obj.localData, userKey, orgKeys);
  }
}

export type WebWorkerResponse = DecryptCipherResponse;

export class DecryptCipherResponse {
  constructor(public id: string, public cipherViews: CipherView[]) {}

  static fromJSON(obj: Jsonify<DecryptCipherResponse>) {
    return new DecryptCipherResponse(
      obj.id,
      obj.cipherViews == null ? null : obj.cipherViews.map((c) => CipherView.fromJSON(c))
    );
  }
}
