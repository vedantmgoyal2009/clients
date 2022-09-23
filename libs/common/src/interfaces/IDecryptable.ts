import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

import { IInitializerMetadata } from "./IInitializerMetadata";

export interface IDecryptable<T> extends IInitializerMetadata {
  decrypt: (key?: SymmetricCryptoKey) => Promise<T>;
}
