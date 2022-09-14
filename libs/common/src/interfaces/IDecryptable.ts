import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

export interface IDecryptable<T> {
  organizationId: string;
  decrypt: (key?: SymmetricCryptoKey) => Promise<T>;
}
