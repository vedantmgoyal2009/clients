import { IDecryptable } from "../interfaces/IDecryptable";
import { IEncrypted } from "../interfaces/IEncrypted";
import { IInitializerMetadata } from "../interfaces/IInitializerMetadata";
import { EncArrayBuffer } from "../models/domain/encArrayBuffer";
import { EncString } from "../models/domain/encString";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

export abstract class AbstractEncryptService {
  abstract encrypt(plainValue: string | ArrayBuffer, key: SymmetricCryptoKey): Promise<EncString>;
  abstract encryptToBytes: (
    plainValue: ArrayBuffer,
    key?: SymmetricCryptoKey
  ) => Promise<EncArrayBuffer>;
  abstract decryptToUtf8: (encString: EncString, key: SymmetricCryptoKey) => Promise<string>;
  abstract decryptToBytes: (encThing: IEncrypted, key: SymmetricCryptoKey) => Promise<ArrayBuffer>;
  abstract resolveLegacyKey: (key: SymmetricCryptoKey, encThing: IEncrypted) => SymmetricCryptoKey;
  abstract decryptItems: <T extends IInitializerMetadata>(
    items: IDecryptable<T>[],
    key: SymmetricCryptoKey
  ) => Promise<T[]>;
}
