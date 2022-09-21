import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { InitializerKey } from "../services/cryptography/classInitializers";

export interface IDecryptable<T> {
  initializerKey: InitializerKey;
  decrypt: (key?: SymmetricCryptoKey) => Promise<T>;
}
