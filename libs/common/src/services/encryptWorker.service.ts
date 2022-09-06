import { Jsonify } from "type-fest";

import { CryptoService } from "../abstractions/crypto.service";
import { AbstractEncryptWorkerService } from "../abstractions/encryptWorker.service";
import { LogService } from "../abstractions/log.service";
import { PlatformUtilsService } from "../abstractions/platformUtils.service";
import { flagEnabled } from "../misc/flags";
import { Utils } from "../misc/utils";
import { CipherData } from "../models/data/cipherData";
import { LocalData } from "../models/data/localData";
import { CipherView } from "../models/view/cipherView";
import { DecryptCipherResponse, DecryptCipherRequest } from "../workers/workerRequestResponse";

// TTL (time to live) is not strictly required but avoids tying up memory resources if inactive
const workerTTL = 3 * 60000; // 3 minutes

export class EncryptWorkerService implements AbstractEncryptWorkerService {
  private worker: Worker;
  private timeout: any;

  constructor(
    private logService: LogService,
    private platformUtilsService: PlatformUtilsService,
    private win: Window,
    private cryptoService: CryptoService
  ) {}

  isSupported() {
    return (
      this.platformUtilsService.supportsWorkers(this.win) && flagEnabled("webWorkerDecryption")
    );
  }

  async decryptCiphers(
    cipherData: { [id: string]: CipherData },
    localData?: { [cipherId: string]: LocalData }
  ): Promise<CipherView[]> {
    if (cipherData == null || Object.keys(cipherData).length < 1) {
      return [];
    }

    this.logService.info("Starting decryption using web worker");

    if (this.worker == null) {
      this.worker = this.createWorker();
    } else {
      this.restartTimeout();
    }

    // Construct the request packet to be sent to the worker
    const orgKeys = await this.cryptoService.getOrgKeys();
    const userKey = await this.cryptoService.getKeyForUserEncryption();
    const request = new DecryptCipherRequest(
      Utils.newGuid(),
      cipherData,
      localData,
      userKey,
      orgKeys
    );

    return new Promise((resolve, reject) => {
      // Listen for response containing decrypted items
      this.worker.addEventListener("message", async (event: { data: string }) => {
        const response: Jsonify<DecryptCipherResponse> = JSON.parse(event.data);
        if (response.id != request.id) {
          return;
        }

        resolve(DecryptCipherResponse.fromJSON(response).cipherViews);
      });

      // Send the request to the worker
      this.worker.postMessage(JSON.stringify(request));
    });
  }

  async decryptOrgCiphers(cipherData: CipherData[]): Promise<CipherView[]> {
    const ciphersDict: { [orgId: string]: CipherData } = {};
    cipherData.forEach((cd) => (ciphersDict[cd.id] = cd));
    return await this.decryptCiphers(ciphersDict);
  }

  clear() {
    this.logService.info("Terminating encryption worker");
    this.worker?.terminate();
    this.worker = null;
    this.clearTimeout();
  }

  private createWorker() {
    this.restartTimeout();
    return new Worker(new URL("../workers/encrypt.worker.ts", import.meta.url));
  }

  private restartTimeout() {
    this.clearTimeout();
    this.timeout = setTimeout(() => this.clear(), workerTTL);
  }

  private clearTimeout() {
    if (this.timeout != null) {
      clearTimeout(this.timeout);
    }
  }
}
