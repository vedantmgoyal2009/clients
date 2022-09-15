import {
  defaultIfEmpty,
  filter,
  firstValueFrom,
  fromEvent,
  map,
  Observable,
  Subject,
  takeUntil,
} from "rxjs";
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

  private workerMessages$: Observable<any>;
  private clear$ = new Subject<void>();

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
      this.workerMessages$ = fromEvent(this.worker, "message").pipe(takeUntil(this.clear$));
    }

    this.restartTimeout();

    const request = {
      id: Utils.newGuid(),
      items: items,
      keys: keys instanceof SymmetricCryptoKey ? keys : Array.from(keys.entries()),
    };

    this.worker.postMessage(JSON.stringify(request));

    return await firstValueFrom(
      this.workerMessages$.pipe(
        filter((response) => response.data?.id === request.id),
        map((response) => JSON.parse(response.data.items)),
        map((items) =>
          items.map((jsonItem: Jsonify<T> & IDecrypted) => {
            const itemClass = getClass(jsonItem.typeName);
            return itemClass.fromJSON(jsonItem) as T;
          })
        ),
        defaultIfEmpty([])
      )
    );
  }

  private clear() {
    this.clear$.next();
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
