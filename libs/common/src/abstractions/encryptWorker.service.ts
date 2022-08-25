import { CipherData } from "../models/data/cipherData";
import { LocalData } from "../models/data/localData";
import { CipherView } from "../models/view/cipherView";

export abstract class AbstractEncryptWorkerService {
  isSupported: () => boolean;
  decryptCiphers: (
    cipherData: { [id: string]: CipherData },
    localData: { [cipherId: string]: LocalData }
  ) => Promise<CipherView[]>;
  decryptOrgCiphers: (cipherData: CipherData[]) => Promise<CipherView[]>;
  clear: () => void;
}
