import { Jsonify } from "type-fest";

import { Cipher } from "../models/domain/cipher";
import { CipherView } from "../models/view/cipherView";
import { ConsoleLogService } from "../services/consoleLog.service";
import { ContainerService } from "../services/container.service";
import { EncryptService } from "../services/encrypt.service";
import { WebCryptoFunctionService } from "../services/webCryptoFunction.service";

import { DecryptCipherRequest, WebWorkerRequest, WebWorkerResponse } from "./workerRequestResponse";

const workerApi: Worker = self as any;

let inited = false;

workerApi.addEventListener("message", async (event: { data: string }) => {
  EncryptWorker.init();

  const request: Jsonify<WebWorkerRequest> = JSON.parse(event.data);
  const response = await EncryptWorker.processMessage(request);

  workerApi.postMessage(JSON.stringify(response));
});

export class EncryptWorker {
  static init() {
    if (inited) {
      return;
    }

    const cryptoFunctionService = new WebCryptoFunctionService(self);
    const logService = new ConsoleLogService(false); // TODO: this probably needs to be a custom logservice to send log messages back to main thread
    const encryptService = new EncryptService(cryptoFunctionService, logService, true);

    const bitwardenContainerService = new ContainerService(null, encryptService);
    bitwardenContainerService.attachToGlobal(self);

    inited = true;
  }

  static async processMessage(request: Jsonify<WebWorkerRequest>): Promise<WebWorkerResponse> {
    switch (request.type) {
      case "decryptCiphers": {
        const decCiphers = await this.decryptCiphers(DecryptCipherRequest.fromJSON(request));
        return {
          id: request.id,
          cipherViews: decCiphers,
        };
      }

      default:
        break;
    }
  }

  static async decryptCiphers({ localData, cipherData, userKey, orgKeys }: DecryptCipherRequest) {
    const promises: any[] = [];
    const result: CipherView[] = [];

    for (const [id, cd] of Object.entries(cipherData)) {
      // Construct domain object with localData
      const cipher = new Cipher(cd, localData ? localData[id] : null);

      // Get key
      const key = cipher.organizationId == null ? userKey : orgKeys[cipher.organizationId];
      if (key == null) {
        throw new Error(
          "No key provided for " + cipher.id + " (org Id: " + cipher.organizationId + ")"
        );
      }

      // Decrypt
      promises.push(cipher.decrypt(key).then((c) => result.push(c)));
    }

    await Promise.all(promises);
    return result;
  }
}
