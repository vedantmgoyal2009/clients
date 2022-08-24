import { CipherData } from "../models/data/cipherData";
import { LocalData } from "../models/data/localData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

export abstract class AbstractEncryptWorkerService {
  isSupported: () => boolean;
  decryptCiphers: (
    cipherData: { [id: string]: CipherData },
    localData: { [cipherId: string]: LocalData },
    orgKeys: Map<string, SymmetricCryptoKey>,
    userKey: SymmetricCryptoKey
  ) => Promise<CipherView[]>;
  terminateAll: (userId?: string) => Promise<void>;
}
