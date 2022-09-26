import { EncString, SymmetricCryptoKey } from "@bitwarden/common/models/domain";

import { IEncrypted } from "../interfaces/IEncrypted";
import { EncArrayBuffer } from "../models/domain";

export abstract class AbstractEncryptService {
  abstract encrypt(plainValue: string | ArrayBuffer, key: SymmetricCryptoKey): Promise<EncString>;
  abstract encryptToBytes: (
    plainValue: ArrayBuffer,
    key?: SymmetricCryptoKey
  ) => Promise<EncArrayBuffer>;
  abstract decryptToUtf8: (encString: EncString, key: SymmetricCryptoKey) => Promise<string>;
  abstract decryptToBytes: (encThing: IEncrypted, key: SymmetricCryptoKey) => Promise<ArrayBuffer>;
  abstract resolveLegacyKey: (key: SymmetricCryptoKey, encThing: IEncrypted) => SymmetricCryptoKey;
}
