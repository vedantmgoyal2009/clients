import { Cipher } from "../models/domain/cipher";
import { CipherView } from "../models/view/cipherView";

const workerApi: Worker = self as any;

// workerApi.addEventListener('message', async event => {
//     if (event.data.type !== 'decryptManyRequest' || !firstRun) {
//         return;
//     }
//     firstRun = false;
//     const decryptAllWorker = new CryptoWorker(event.data, workerApi);
//     await decryptAllWorker.decryptMany();
// });

workerApi.addEventListener("message", async (event) => {
  workerApi.postMessage("The command received was: " + event.data.command);
});
