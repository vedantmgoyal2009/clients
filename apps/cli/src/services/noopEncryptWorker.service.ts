import { AbstractEncryptWorkerService } from "@bitwarden/common/abstractions/encryptWorker.service";
import { CipherData } from "@bitwarden/common/models/data/cipherData";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

// Required so that node will not try to import encrypt.worker.ts which is not included in the TS compilation
export class NoopEncryptWorkerService implements AbstractEncryptWorkerService {
  isSupported() {
    return false;
  }

  terminateAll(userId?: string): Promise<void> {
    return;
  }

  decryptCiphers(
    cipherData: { [id: string]: CipherData },
    localData: any[],
    orgKeys: Map<string, SymmetricCryptoKey>,
    userKey: SymmetricCryptoKey
  ): Promise<CipherView[]> {
    return;
  }
}
