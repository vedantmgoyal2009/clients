import { Jsonify } from "type-fest";

import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";

import { CryptoFunctionService } from "../abstractions/cryptoFunction.service";
import { LogService } from "../abstractions/log.service";
import { IDecryptable } from "../interfaces/IDecryptable";
import { IDecrypted } from "../interfaces/IDecrypted";
import { Utils } from "../misc/utils";

import { getClass } from "./cryptography/typeMap";
import { EncryptService } from "./encrypt.service";

// TTL (time to live) is not strictly required but avoids tying up memory resources if inactive
const workerTTL = 3 * 60000; // 3 minutes

export class MultithreadEncryptService extends EncryptService {
  private worker: Worker;
  private timeout: any;

  constructor(
    cryptoFunctionService: CryptoFunctionService,
    logService: LogService,
    logMacFailures: boolean,
    private createWorker: () => Worker
  ) {
    super(cryptoFunctionService, logService, logMacFailures);
  }

  /**
   * Sends items to a web worker to decrypt them.
   * This utilises multithreading to decrypt items faster without interrupting other operations.
   */
  async decryptItems<T>(
    items: IDecryptable<T>[],
    keys: SymmetricCryptoKey | Map<string, SymmetricCryptoKey>
  ): Promise<T[]> {
    if (items == null || items.length < 1) {
      return [];
    }

    this.logService.info("Starting decryption using multithreading");

    if (this.worker == null) {
      this.worker = this.createWorker();
    }

    this.restartTimeout();

    const request = {
      id: Utils.newGuid(),
      items: items,
      keys: keys instanceof SymmetricCryptoKey ? keys : Array.from(keys.entries()),
    };

    return new Promise((resolve) => {
      // Listen for response containing decrypted items
      this.worker.addEventListener("message", async (event: { data: string }) => {
        const response: {
          id: string;
          items: Jsonify<T> & IDecrypted[]; // TODO: this should probably be in the <T> definition
        } = JSON.parse(event.data);

        if (response.id != request.id) {
          return;
        }

        const result = response.items.map((jsonItem) => {
          const itemClass = getClass(jsonItem.typeName);
          return itemClass.fromJSON(jsonItem) as T;
        });

        resolve(result);
      });

      // Send the request to the worker
      this.worker.postMessage(JSON.stringify(request));
    });
  }

  private clear() {
    this.worker?.terminate();
    this.worker = null;
    this.clearTimeout();
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
