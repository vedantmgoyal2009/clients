import NativeMessageService from "./nativeMessageService";
import * as config from "./variables";

(async () => {
  const nativeMessageService = new NativeMessageService(1.0);

  const response = await nativeMessageService.sendHandshake(config.testRsaPublicKey);
  console.log("[Handshake Command]\x1b[32m Received response to handshake request \x1b[0m");
  if (response.status === "success") {
    console.log("[Handshake Command]\x1b[32m Handshake success response \x1b[0m");
  } else {
    console.log("[Handshake Command]\x1b[31m Handshake failure response \x1b[0m");
  }
  nativeMessageService.disconnect();
})();
