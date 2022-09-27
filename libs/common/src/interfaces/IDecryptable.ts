import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

import { IInitializerMetadata } from "./IInitializerMetadata";

/**
 * An object that contains EncStrings and knows how to decrypt them. This is usually a domain object with the
 * corresponding view object as the type argument.
 * @example Cipher implements IDecryptable<CipherView>
 */
export interface IDecryptable<T extends IInitializerMetadata> extends IInitializerMetadata {
  decrypt: (key?: SymmetricCryptoKey) => Promise<T>;
}
