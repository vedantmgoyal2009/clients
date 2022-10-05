import { defaultIfEmpty, filter, firstValueFrom, fromEvent, map, Subject, takeUntil } from "rxjs";
import { Jsonify } from "type-fest";

import { IDecryptable } from "../interfaces/IDecryptable";
import { IInitializerMetadata } from "../interfaces/IInitializerMetadata";
import { Utils } from "../misc/utils";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

import { getInitializer } from "./cryptography/classInitializers";
import { EncryptService } from "./encrypt.service";

// TTL (time to live) is not strictly required but avoids tying up memory resources if inactive
const workerTTL = 3 * 60000; // 3 minutes

export class MultithreadEncryptService extends EncryptService {
  private worker: Worker;
  private timeout: any;

  private clear$ = new Subject<void>();

  /**
   * Sends items to a web worker to decrypt them.
   * This utilises multithreading to decrypt items faster without interrupting other operations (e.g. updating UI).
   */
  async decryptItems<T extends IInitializerMetadata>(
    items: IDecryptable<T>[],
    key: SymmetricCryptoKey
  ): Promise<T[]> {
    if (items == null || items.length < 1) {
      return [];
    }

    this.logService.info("Starting decryption using multithreading");

    this.worker ??= new Worker(
      new URL("@bitwarden/common/services/cryptography/encrypt.worker.ts", import.meta.url)
    );

    this.restartTimeout();

    const request = {
      id: Utils.newGuid(),
      items: items,
      key: key,
    };

    this.worker.postMessage(JSON.stringify(request));

    return await firstValueFrom(
      fromEvent(this.worker, "message").pipe(
        filter((response: MessageEvent) => response.data?.id === request.id),
        map((response) => JSON.parse(response.data.items)),
        map((items) =>
          items.map((jsonItem: Jsonify<T>) => {
            const initializer = getInitializer<T>(jsonItem.initializerKey);
            return initializer(jsonItem);
          })
        ),
        takeUntil(this.clear$),
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