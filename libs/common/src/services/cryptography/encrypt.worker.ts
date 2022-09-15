import { Jsonify } from "type-fest";

import { IDecryptable } from "../../interfaces/IDecryptable";
import { SymmetricCryptoKey } from "../../models/domain/symmetricCryptoKey";
import { ConsoleLogService } from "../../services/consoleLog.service";
import { ContainerService } from "../../services/container.service";
import { EncryptService } from "../../services/encrypt.service";
import { WebCryptoFunctionService } from "../../services/webCryptoFunction.service";

import { getClass } from "./typeMap";

const workerApi: Worker = self as any;

let inited = false;
let encryptService: EncryptService;

/**
 * Bootstrap the worker environment with services required for decryption
 */
export function init() {
  const cryptoFunctionService = new WebCryptoFunctionService(self);
  const logService = new ConsoleLogService(false);
  encryptService = new EncryptService(cryptoFunctionService, logService, true);

  const bitwardenContainerService = new ContainerService(null, encryptService);
  bitwardenContainerService.attachToGlobal(self);

  inited = true;
}

/**
 * Listen for messages and decrypt their contents
 */
workerApi.addEventListener("message", async (event: { data: string }) => {
  if (!inited) {
    init();
  }

  const request: {
    id: string;
    items: Jsonify<IDecryptable<any>>[];
    keys: [string, Jsonify<SymmetricCryptoKey>][] | Jsonify<SymmetricCryptoKey>;
  } = JSON.parse(event.data);

  let keys: any;
  if (request.keys instanceof Array) {
    keys = new Map(
      request.keys.map(([orgId, jsonKey]) => [orgId, SymmetricCryptoKey.fromJSON(jsonKey)])
    );
  } else {
    keys = SymmetricCryptoKey.fromJSON(request.keys);
  }

  const items: IDecryptable<any>[] = request.items.map((i) => {
    const itemClass = getClass(i.typeName);
    return itemClass.fromJSON(i);
  });

  const result = await encryptService.decryptItems(items, keys);

  workerApi.postMessage(
    JSON.stringify({
      id: request.id,
      items: result,
    })
  );
});
