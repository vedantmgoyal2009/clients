import { AbstractEncryptWorkerService } from "../abstractions/encryptWorker.service";
import { CipherData } from "../models/data/cipherData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

export class EncryptWorkerService implements AbstractEncryptWorkerService {
  async decryptCiphers(cipherData: CipherData[], key: SymmetricCryptoKey): Promise<CipherView[]> {
    const message = {
      command: "decryptCiphers",
    };

    return new Promise((resolve, reject) => {
      const worker = this.createWorker();

      worker.addEventListener("message", (response) => {
        this.terminate(worker);
        console.log("msg received");
        console.log(response);
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
