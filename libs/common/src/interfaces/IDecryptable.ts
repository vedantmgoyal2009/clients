import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

export interface IDecryptable<T> {
  typeName: string;
  organizationId: string;
  decrypt: (key?: SymmetricCryptoKey) => Promise<T>;
}
