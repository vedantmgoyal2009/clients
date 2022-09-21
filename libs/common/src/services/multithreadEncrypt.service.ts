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

import { IDecryptable } from "../interfaces/IDecryptable";
import { IDecrypted } from "../interfaces/IDecrypted";
import { Utils } from "../misc/utils";

import { getInitializer } from "./cryptography/classInitializers";
import { EncryptService } from "./encrypt.service";

// TTL (time to live) is not strictly required but avoids tying up memory resources if inactive
const workerTTL = 3 * 60000; // 3 minutes

export class MultithreadEncryptService extends EncryptService {
  private worker: Worker;
  private timeout: any;

  private workerMessages$: Observable<any>;
  private clear$ = new Subject<void>();

  /**
   * Sends items to a web worker to decrypt them.
   * This utilises multithreading to decrypt items faster without interrupting other operations (e.g. updating UI)
   */
  async decryptItems<T>(items: IDecryptable<T>[], key: SymmetricCryptoKey): Promise<T[]> {
    if (items == null || items.length < 1) {
      return [];
    }

    this.logService.info("Starting decryption using multithreading");

    if (this.worker == null) {
      (this.worker = new Worker(
        new URL("@bitwarden/common/services/cryptography/encrypt.worker.ts", import.meta.url)
      )),
        (this.workerMessages$ = fromEvent(this.worker, "message").pipe(takeUntil(this.clear$)));
    }

    this.restartTimeout();

    const request = {
      id: Utils.newGuid(),
      items: items,
      key: key,
    };

    this.worker.postMessage(JSON.stringify(request));

    return await firstValueFrom(
      this.workerMessages$.pipe(
        filter((response) => response.data?.id === request.id),
        map((response) => JSON.parse(response.data.items)),
        map((items) =>
          items.map((jsonItem: Jsonify<T> & IDecrypted) => {
            const initializer = getInitializer<T>(jsonItem.initializerKey);
            return initializer(jsonItem);
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
