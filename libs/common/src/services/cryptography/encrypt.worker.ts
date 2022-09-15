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

  const keys = buildKeys(request.keys);
  const items = request.items.map(buildItem);

  const result = await encryptService.decryptItems(items, keys);

  workerApi.postMessage({
    id: request.id,
    items: JSON.stringify(result),
  });
});

function buildKeys(keys: [string, Jsonify<SymmetricCryptoKey>][] | Jsonify<SymmetricCryptoKey>) {
  if (keys == null) {
    return null;
  }

  if (keys instanceof Array) {
    return new Map(keys.map(([orgId, jsonKey]) => [orgId, SymmetricCryptoKey.fromJSON(jsonKey)]));
  }

  return SymmetricCryptoKey.fromJSON(keys);
}

function buildItem(jsonItem: Jsonify<IDecryptable<any>>): IDecryptable<any> {
  const itemClass = getClass(jsonItem.typeName);
  return itemClass.fromJSON(jsonItem);
}
