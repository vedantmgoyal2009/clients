import { WorkerMessageType } from "../enums/workerCommand";
import { CipherData } from "../models/data/cipherData";
import { Cipher } from "../models/domain/cipher";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";
import { ConsoleLogService } from "../services/consoleLog.service";
import { ContainerService } from "../services/container.service";
import { EncryptService } from "../services/encrypt.service";
import { WebCryptoFunctionService } from "../services/webCryptoFunction.service";

type WorkerCommand = DecryptCipherCommand;

export type DecryptCipherCommand = {
  command: WorkerMessageType.decryptCiphersCommand;
  cipherData: { [id: string]: CipherData };
  localData: any;
  orgKeys: { [orgId: string]: SymmetricCryptoKey };
  userKey: SymmetricCryptoKey;
};

type WorkerResponse = DecryptCipherResponse;

export type DecryptCipherResponse = {
  command: WorkerMessageType.decryptCiphersResponse;
  cipherViews: string;
};

const workerApi: Worker = self as any;

workerApi.addEventListener("message", async (event: { data: WorkerCommand }) => {
  initServices();
  const encryptWorker = new EncryptWorker();
  const response = await encryptWorker.processMessage(event.data);
  workerApi.postMessage(response);

  // Clean up memory
  event = null;
});

function initServices() {
  const cryptoFunctionService = new WebCryptoFunctionService(self);
  const logService = new ConsoleLogService(false); // TODO: this probably needs to be a custom logservice to send log messages back to main thread
  const encryptService = new EncryptService(cryptoFunctionService, logService, true);

  const bitwardenContainerService = new ContainerService(null, encryptService);
  bitwardenContainerService.attachToGlobal(self);
}

export class EncryptWorker {
  async processMessage(message: WorkerCommand): Promise<WorkerResponse> {
    switch (message.command) {
      case WorkerMessageType.decryptCiphersCommand: {
        const decCiphers = await this.decryptCiphers(message);
        return {
          command: WorkerMessageType.decryptCiphersResponse,
          cipherViews: JSON.stringify(decCiphers),
        };
      }

      default:
        break;
    }
  }

  async decryptCiphers({ cipherData, localData, orgKeys, userKey }: DecryptCipherCommand) {
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
