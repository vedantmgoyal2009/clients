import { WorkerCommand } from "../enums/workerCommand";
import { CipherData } from "../models/data/cipherData";
import { Cipher } from "../models/domain/cipher";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";
import { ContainerService } from "../services/container.service";
import { EncryptService } from "../services/encrypt.service";

const workerApi: Worker = self as any;

type WorkerInstruction = DecryptCipherInstruction;

type DecryptCipherInstruction = {
  command: WorkerCommand.decryptCiphers;
  cipherData: { [id: string]: CipherData };
  localData: any;
  orgKeys: { [orgId: string]: SymmetricCryptoKey };
  userKey: SymmetricCryptoKey;
};

workerApi.addEventListener("message", async (event) => {
  const message: WorkerInstruction = event.data;

  switch (message.command) {
    case WorkerCommand.decryptCiphers: {
      const decryptAllWorker = new EncryptWorker();
      let result = await decryptAllWorker.decryptCiphers(message);

      workerApi.postMessage({
        command: WorkerCommand.decryptCiphers,
        data: result,
      });

      // Clean up memory
      result = null;
      event = null;
      break;
    }

    default:
      break;
  }
});

export class EncryptWorker {
  initEncryptService() {
    // TODO: init ContainerService and EncryptService and attach to GlobalThis
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
