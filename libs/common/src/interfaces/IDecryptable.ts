import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { InitializerKey } from "../services/cryptography/classInitializers";

export interface IDecryptable<T> {
  initializerKey: InitializerKey;
  organizationId: string;
  decrypt: (key?: SymmetricCryptoKey) => Promise<T>;
}
