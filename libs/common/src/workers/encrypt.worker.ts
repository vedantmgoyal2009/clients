import { WorkerCommand } from "../enums/workerCommand";
import { CipherData } from "../models/data/cipherData";
import { Cipher } from "../models/domain/cipher";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

const workerApi: Worker = self as any;

type WorkerInstruction = DecryptCipherInstruction;

type DecryptCipherInstruction = {
  command: WorkerCommand.decryptCiphers;
  cipherData: { [id: string]: CipherData };
  localData: any;
  orgKeys: { [orgId: string]: SymmetricCryptoKey };
  userKey: SymmetricCryptoKey;
};

type WorkerResponse = DecryptCipherResponse;

type DecryptCipherResponse = {
  command: WorkerCommand.decryptCiphers;
  data: CipherView[];
};

workerApi.addEventListener("message", async (event: { data: WorkerInstruction }) => {
  // TODO: bootstrap services
  const encryptWorker = new EncryptWorker();

  workerApi.postMessage({
    command: WorkerCommand.decryptCiphers,
    data: await encryptWorker.processMessage(event.data),
  });

  // Clean up memory
  event = null;
});

export class EncryptWorker {
  async processMessage(message: WorkerInstruction): Promise<WorkerResponse> {
    switch (message.command) {
      case WorkerCommand.decryptCiphers: {
        return {
          command: WorkerCommand.decryptCiphers,
          data: await this.decryptCiphers(message),
        };
      }

      default:
        break;
    }
  }

  async decryptCiphers({ cipherData, localData, orgKeys, userKey }: DecryptCipherInstruction) {
    const promises: any[] = [];
    const result: CipherView[] = [];

    for (const [id, cd] of Object.entries(cipherData)) {
      // Construct domain object with localData
      const cipher = new Cipher(cd, localData ? localData[id] : null);

      // Get key
      const key = cipher.organizationId == null ? userKey : orgKeys[cipher.organizationId];

      // TODO: what if key is null?

      // Decrypt
      promises.push(cipher.decrypt(key).then((c) => result.push(c)));
    }

    await Promise.all(promises);
    return result;
  }
}
