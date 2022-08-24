import { filter, Subject, take } from "rxjs";
import { Jsonify } from "type-fest";

import { AbstractEncryptWorkerService } from "../abstractions/encryptWorker.service";
import { LogService } from "../abstractions/log.service";
import { PlatformUtilsService } from "../abstractions/platformUtils.service";
import { StateService } from "../abstractions/state.service";
import { Utils } from "../misc/utils";
import { CipherData } from "../models/data/cipherData";
import { LocalData } from "../models/data/localData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";
import { DecryptCipherResponse, DecryptCipherRequest } from "../types/webWorkerRequestResponse";

export class EncryptWorkerService implements AbstractEncryptWorkerService {
  private terminatingWorkers = new Subject<Worker>();

  constructor(
    private logService: LogService,
    private platformUtilsService: PlatformUtilsService,
    private win: Window,
    private stateService: StateService
  ) {}

  isSupported() {
    return this.platformUtilsService.supportsWorkers(this.win);
  }

  async decryptCiphers(
    cipherData: { [id: string]: CipherData },
    localData: { [cipherId: string]: LocalData },
    orgKeys: Map<string, SymmetricCryptoKey>,
    userKey: SymmetricCryptoKey
  ): Promise<CipherView[]> {
    // We can't serialize a map, convert to plain JS object
    const orgKeysObj: { [orgId: string]: SymmetricCryptoKey } = {};
    if (orgKeys != null) {
      orgKeys.forEach((orgKey, orgId) => (orgKeysObj[orgId] = orgKey));
    }

    const request: DecryptCipherRequest = {
      id: Utils.newGuid(),
      type: "decryptCiphers",
      cipherData: cipherData,
      localData: localData,
      orgKeys: orgKeysObj,
      userKey: userKey,
    };

    this.logService.info("Starting vault decryption using web worker");

    // Store the current userId at the start in case it changes while the worker is running
    const userId = await this.stateService.getUserId();
    const worker = await this.createWorker(userId);

    return new Promise((resolve, reject) => {
      // Listen for completed work
      worker.addEventListener("message", async (event: { data: string }) => {
        const response: Jsonify<DecryptCipherResponse> = JSON.parse(event.data);
        if (response.id != request.id) {
          return;
        }
        await this.terminateWorker(worker, userId);

        resolve(
          response.cipherViews == null
            ? []
            : response.cipherViews.map((c) => CipherView.fromJSON(c))
        );
      });

      // Listen for early termination so we're not left hanging if a worker is terminated
      this.terminatingWorkers
        .pipe(filter((w) => w === worker))
        .pipe(take(1))
        .subscribe(() => resolve([]));

      // Caution: this may not work/be supported in node. Need to test
      worker.addEventListener("error", (event) => {
        reject("An unexpected error occurred in a worker: " + event.message);
      });

      worker.postMessage(JSON.stringify(request));
    });
  }

  async terminateAll(userId?: string) {
    const activeWorkers = await this.stateService.getWebWorkers({ userId });
    if (activeWorkers == null) {
      return;
    }

    activeWorkers.forEach((w) => {
      this.terminatingWorkers.next(w);
      w.terminate();
    });

    this.stateService.setWebWorkers(null, { userId });
  }

  private async createWorker(userId: string) {
    const worker = new Worker(new URL("../workers/encrypt.worker.ts", import.meta.url));

    let activeWorkers = await this.stateService.getWebWorkers({ userId });
    if (activeWorkers == null) {
      activeWorkers = new Set();
    }
    activeWorkers.add(worker);
    await this.stateService.setWebWorkers(activeWorkers, { userId });

    return worker;
  }

  private async terminateWorker(worker: Worker, userId: string) {
    const activeWorkers = await this.stateService.getWebWorkers({ userId });
    activeWorkers.delete(worker);
    await this.stateService.setWebWorkers(activeWorkers, { userId });

    worker.terminate();
  }
}
