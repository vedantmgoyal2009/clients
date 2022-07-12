import { AbstractEncryptWorkerService } from "../abstractions/encryptWorker.service";
import { WorkerCommand } from "../enums/workerCommand";
import { CipherData } from "../models/data/cipherData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

export class EncryptWorkerService implements AbstractEncryptWorkerService {
  async decryptCiphers(
    cipherData: { [id: string]: CipherData },
    localData: any[],
    orgKeys: { [orgId: string]: SymmetricCryptoKey },
    userKey: SymmetricCryptoKey
  ): Promise<CipherView[]> {
    const message = {
      command: WorkerCommand.decryptCiphers,
      cipherData: cipherData,
      localData: localData,
      orgKeys: orgKeys,
      userKey: userKey,
    };

    return new Promise((resolve, reject) => {
      const worker = this.createWorker();

      worker.addEventListener("message", (response) => {
        // TODO: handle result (just deserialize?)
        resolve(null);
      });

      worker.postMessage(message);
    });
  }

  private createWorker() {
    return new Worker(new URL("../workers/encrypt.worker.ts", import.meta.url));
  }

  private terminate(worker: Worker) {
    worker.terminate();
  }
}
