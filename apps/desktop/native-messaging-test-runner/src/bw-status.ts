import "module-alias/register";
import NativeMessageService from "./nativeMessageService";
import * as config from "./variables";

(async () => {
  const nativeMessageService = new NativeMessageService(1.0);

  console.log("[Status Command]\x1b[32m Sending Handshake \x1b[0m");
  const handshakeResponse = await nativeMessageService.sendHandshake(config.testRsaPublicKey);
  console.log("[Status Command]\x1b[32m Received response to handshake request \x1b[0m");

  if (handshakeResponse.status !== "success") {
    console.log(
      `[Status Command]\x1b[31m Handshake failed \x1b[0m Status was: ${handshakeResponse.status}`
    );
    return;
  }
  console.log("[Status Command]\x1b[32m Handshake success response \x1b[0m");
  const status = await nativeMessageService.checkStatus(handshakeResponse.sharedKey);

  console.log(`[Status Command] Status output is: `, status);

  nativeMessageService.disconnect();
})();
