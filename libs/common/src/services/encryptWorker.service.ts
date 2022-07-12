import { AbstractEncryptWorkerService } from "../abstractions/encryptWorker.service";
import { WorkerCommand } from "../enums/workerCommand";
import { CipherData } from "../models/data/cipherData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

export class EncryptWorkerService implements AbstractEncryptWorkerService {
  async decryptCiphers(
    cipherData: { [id: string]: CipherData },
    localData: any[],
    orgKeys: Map<string, SymmetricCryptoKey>,
    userKey: SymmetricCryptoKey
  ): Promise<CipherView[]> {
    // We can't serialize a map, convert to plain JS object
    const orgKeysObj: { [orgId: string]: SymmetricCryptoKey } = {};
    orgKeys.forEach((orgKey, orgId) => (orgKeysObj[orgId] = orgKey));

    const message = {
      command: WorkerCommand.decryptCiphers,
      cipherData: cipherData,
      localData: localData,
      orgKeys: orgKeysObj,
      userKey: userKey,
    };

    return new Promise((resolve, reject) => {
      const worker = this.createWorker();

      worker.addEventListener("message", (response) => {
        // TODO: handle result (just deserialize?)
        this.terminateWorker(worker);
        resolve(null);
      });

      worker.postMessage(message);
    });
  }

  // TODO: public method to terminate all workers on lock/logout

  private createWorker() {
    return new Worker(new URL("../workers/encrypt.worker.ts", import.meta.url));
  }

  private terminateWorker(worker: Worker) {
    worker.terminate();
  }
}
