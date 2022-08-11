/* eslint-disable*/
import "module-alias/register";
import { NodeCryptoFunctionService } from "@bitwarden/node/services/nodeCryptoFunction.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { homedir } from "os";
import * as config from "./variables";

const ipc = require("node-ipc").default;

ipc.config.id = "native-messaging-test-runner";
ipc.config.retry = 1500;
ipc.config.silent = false;
ipc.config.logger = () => {}; // Passes empty function as logger. It is fairly verbose and clutters the output

export default class TestIPC {
  private desktopAppPath = homedir + "/tmp/app.bitwarden";

  async connect() {
    return new Promise((resolve) => {
      ipc.connectTo("bitwarden", this.desktopAppPath, () => {
        ipc.of.bitwarden.on("message", async (message: any) => {
          await this.handleResponse(message);
        });

        ipc.of.bitwarden.on("error", (err: any) => {
          console.error("error", err);
          console.log("\x1b[33m Please make sure the desktop app is running locally \x1b[0m");
        });

        ipc.of.bitwarden.on("disconnect", () => {
          console.log("disconnected from desktop app");
          this.disconnect();
        });

        resolve(null);
      });
    });
  }

  disconnect() {
    ipc.disconnect("bitwarden");
  }

  emitEvent = (event: string, payload: any) => {
    ipc.of.bitwarden.emit(event, payload);
  };

  // Exisitng commands
  sendCommandLegacy = (command: string, data: any) => {
    console.log(`sending command: ${command}`);
    this.emitEvent("message", {
      appId: "native-messaging-test-runner",
      message: {
        ...data,
        command,
      },
    });
  };

  // Handshake command should be the only one using this
  sendUnencryptedCommandV1(message: any): void {
    console.log(`sending command: ${message.command}`);
    this.emitEvent("message", message);
  }

  sendEncryptedCommandV1 = (message: any) => {
    console.log(`sending command: ${message.encryptedCommand}`);
    this.emitEvent("message", message);
  };

  async handleResponse(message: any) {
    if (message.messageId === "handshake-message-id") {
      await this.handleHandshakeResponse(message);
      if (message.version == 1) {
        console.log("\x1b[32m Handshake has correct version of 1 \x1b[0m");
      } else {
        console.log("\x1b[31m Handshake returned with missing or incorrect version \x1b[0m");
      }
      this.disconnect();
    } else if (message.status === "canceled") {
      console.log("\x1b[33m Connected to Desktop app, but operation was canceled. \x1b[0m");
      console.log(
        "\x1b[33m Make sure 'Allow DuckDuckGo browser integration' setting is enabled. \x1b[0m"
      );
      this.disconnect();
    } else {
      console.log("Received some other message: ", message);
    }
  }

  async handleHandshakeResponse(message: any) {
    console.log("\x1b[32m Received response to handshake request \x1b[0m");
    if (message.payload.sharedKey) {
      console.log("\x1b[32m Handshake has shared key \x1b[0m");

      const nodeCryptoFunctionService = new NodeCryptoFunctionService();
      const privKey = Utils.fromB64ToArray(config.testRsaPrivateKey).buffer;
      const dataBuffer = Utils.fromB64ToArray(message.payload.sharedKey).buffer;
      try {
        await nodeCryptoFunctionService.rsaDecrypt(dataBuffer, privKey, "sha1");
        console.log("\x1b[32m Shared key is decryptable \x1b[0m");
      } catch (Exception) {
        console.log("\x1b[31m Error decrypting shared key \x1b[0m");
      }
    }
    if (message.payload.status === "success") {
      console.log("\x1b[32m Handshake success response \x1b[0m");
    } else if (message.status === "failure") {
      console.log("\x1b[31m Handshake failure response \x1b[0m");
    }
  }
}
