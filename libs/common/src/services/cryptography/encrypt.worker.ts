import { Jsonify } from "type-fest";

import { IDecryptable } from "../../interfaces/IDecryptable";
import { SymmetricCryptoKey } from "../../models/domain/symmetricCryptoKey";
import { ConsoleLogService } from "../../services/consoleLog.service";
import { ContainerService } from "../../services/container.service";
import { WebCryptoFunctionService } from "../../services/webCryptoFunction.service";

import { getInitializer } from "./classInitializers";
import { EncryptServiceImplementation } from "./encrypt.service.implementation";

const workerApi: Worker = self as any;

let inited = false;
let encryptService: EncryptServiceImplementation;

/**
 * Bootstrap the worker environment with services required for decryption
 */
export function init() {
  const cryptoFunctionService = new WebCryptoFunctionService(self);
  const logService = new ConsoleLogService(false);
  encryptService = new EncryptServiceImplementation(cryptoFunctionService, logService, true);

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
    key: Jsonify<SymmetricCryptoKey>;
  } = JSON.parse(event.data);

  const key = SymmetricCryptoKey.fromJSON(request.key);
  const items = request.items.map((jsonItem) => {
    const initializer = getInitializer<IDecryptable<any>>(jsonItem.initializerKey);
    return initializer(jsonItem);
  });
  const result = await encryptService.decryptItems(items, key);

  workerApi.postMessage({
    id: request.id,
    items: JSON.stringify(result),
  });
});
