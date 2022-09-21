import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

import { IInitializerMetadata } from "./IDecrypted";

export interface IDecryptable<T> extends IInitializerMetadata {
  decrypt: (key?: SymmetricCryptoKey) => Promise<T>;
}
