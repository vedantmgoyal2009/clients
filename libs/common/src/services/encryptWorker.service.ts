import { Jsonify } from "type-fest";

import { AbstractEncryptWorkerService } from "../abstractions/encryptWorker.service";
import { LogService } from "../abstractions/log.service";
import { PlatformUtilsService } from "../abstractions/platformUtils.service";
import { Utils } from "../misc/utils";
import { CipherData } from "../models/data/cipherData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";
import { DecryptCipherResponse, DecryptCipherRequest } from "../types/webWorkerRequestResponse";

export class EncryptWorkerService implements AbstractEncryptWorkerService {
  constructor(
    private logService: LogService,
    private platformUtilsService: PlatformUtilsService,
    private win: Window
  ) {}

  isSupported() {
    return this.platformUtilsService.supportsWorkers(this.win);
  }

  async decryptCiphers(
    cipherData: { [id: string]: CipherData },
    localData: any[],
    orgKeys: Map<string, SymmetricCryptoKey>,
    userKey: SymmetricCryptoKey
  ): Promise<CipherView[]> {
    // We can't serialize a map, convert to plain JS object
    const orgKeysObj: { [orgId: string]: SymmetricCryptoKey } = {};
    orgKeys.forEach((orgKey, orgId) => (orgKeysObj[orgId] = orgKey));

    const request: DecryptCipherRequest = {
      id: Utils.newGuid(),
      type: "decryptCiphers",
      cipherData: cipherData,
      localData: localData,
      orgKeys: orgKeysObj,
      userKey: userKey,
    };

    return new Promise((resolve, reject) => {
      const worker = this.createWorker();
      worker.addEventListener("message", (response: { data: DecryptCipherResponse }) => {
        if (response.data.id != request.id) {
          return;
        }
        this.terminateWorker(worker);
        resolve(this.parseCipherResponse(response.data));
      });

      // Caution: this may not work/be supported in node. Need to test
      worker.addEventListener("error", (event) => {
        reject("An unexpected error occurred in a worker: " + event.message);
      });

      worker.postMessage(request);
    });
  }

  private parseCipherResponse(data: DecryptCipherResponse) {
    const parsedCiphers: Jsonify<CipherView>[] =
      data.cipherViews != null ? JSON.parse(data.cipherViews) : [];

    const decCiphers = parsedCiphers.map((c) => CipherView.fromJSON(c));
    return decCiphers;
  }

  // TODO: public method to terminate all workers on lock/logout

  private createWorker() {
    return new Worker(new URL("../workers/encrypt.worker.ts", import.meta.url));
  }

  private terminateWorker(worker: Worker) {
    worker.terminate();
  }
}
