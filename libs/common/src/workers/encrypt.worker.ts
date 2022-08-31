import { Jsonify } from "type-fest";

import { LogService } from "../abstractions/log.service";
import { Cipher } from "../models/domain/cipher";
import { CipherView } from "../models/view/cipherView";
import { ConsoleLogService } from "../services/consoleLog.service";
import { ContainerService } from "../services/container.service";
import { EncryptService } from "../services/encrypt.service";
import { WebCryptoFunctionService } from "../services/webCryptoFunction.service";

import {
  DecryptCipherRequest,
  DecryptCipherResponse,
  WebWorkerRequest,
  WebWorkerResponse,
} from "./workerRequestResponse";

export class EncryptWorker {
  constructor(private logService: LogService) {}

  async processMessage(request: Jsonify<WebWorkerRequest>): Promise<WebWorkerResponse> {
    switch (request.type) {
      case "decryptCiphers": {
        const decCiphers = await this.decryptCiphers(DecryptCipherRequest.fromJSON(request));
        return new DecryptCipherResponse(request.id, decCiphers);
      }

      default:
        break;
    }
  }

  async decryptCiphers({ localData, cipherData, userKey, orgKeys }: DecryptCipherRequest) {
    const promises: any[] = [];
    const result: CipherView[] = [];

    for (const [id, cd] of Object.entries(cipherData)) {
      // Construct domain object with localData
      const cipher = new Cipher(cd, localData ? localData[id] : null);

      // Get key
      const key = cipher.organizationId == null ? userKey : orgKeys[cipher.organizationId];
      if (key == null) {
        // Log this but don't throw because it'll abort the whole vault decryption.
        // Let the null propagate down so that it only affects that item and we get the [error: cannot decrypt] text
        this.logService.error(
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

// Init services and worker class
const cryptoFunctionService = new WebCryptoFunctionService(self);
const logService = new ConsoleLogService(false);
const encryptService = new EncryptService(cryptoFunctionService, logService, true);
const encryptWorker = new EncryptWorker(logService);

const bitwardenContainerService = new ContainerService(null, encryptService);
bitwardenContainerService.attachToGlobal(self);

const workerApi: Worker = self as any;

// Listen for messages
workerApi.addEventListener("message", async (event: { data: string }) => {
  const request: Jsonify<WebWorkerRequest> = JSON.parse(event.data);
  const response = await encryptWorker.processMessage(request);

  workerApi.postMessage(JSON.stringify(response));
});
