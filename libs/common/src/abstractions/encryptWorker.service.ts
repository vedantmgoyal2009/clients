import { CipherData } from "../models/data/cipherData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

export abstract class AbstractEncryptWorkerService {
  decryptCiphers: (cipherData: CipherData[], key: SymmetricCryptoKey) => Promise<CipherView[]>;
}
