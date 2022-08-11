import TestIPC from "./test-ipc";
import * as config from "./variables";

const ipc = new TestIPC();

const handshake = () => {
  const message = {
    appId: "native-messaging-test-running",
    command: "bw-handshake",
    payload: {
      publicKey: config.testRsaPublicKey,
    },
    messageId: "handshake-message-id",
    version: 1.0,
  };

  ipc.sendUnencryptedCommandV1(message);
};

(async () => {
  await ipc.connect();
  handshake();
})();
