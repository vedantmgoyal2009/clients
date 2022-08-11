import { Injectable } from "@angular/core";
import { ipcRenderer } from "electron";

import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { EncString } from "@bitwarden/common/models/domain/encString";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { StateService } from "@bitwarden/common/services/state.service";

export type LegacyMessage = {
  command: string;

  userId?: string;
  timestamp?: number;

  publicKey?: string;
};

export type LegacyOuterMessage = {
  message: LegacyMessage | EncString;
  appId: string;
};

type DecryptedCommand = "bw-handshake";

// TODO
// type EncryptedCommand =
//   | "bw-status"
//   | "bw-credential-retrieval"
//   | "bw-credential-create"
//   | "bw-credential-update"
//   | "bw-generate-password";

// type EncryptedCommandData = {
//   command: EncryptedCommand;
//   payload: string;
// };

export type OuterMessageCommon = {
  version: number;
  messageId: string;
};

export type DecryptedOuterMessage = OuterMessageCommon & {
  command: DecryptedCommand;
  payload: {
    publicKey: string;
  };
};

export type EncryptedOuterMessage = OuterMessageCommon & {
  encryptedCommand: string;
};

export type OuterMessage = DecryptedOuterMessage | EncryptedOuterMessage;

const EncryptionAlgorithm = "sha1";

@Injectable()
export class NativeMessageHandler {
  private ddgSharedSecret: SymmetricCryptoKey;

  constructor(
    private stateService: StateService,
    private cryptoService: CryptoService,
    private cryptoFunctionService: CryptoFunctionService
  ) {}

  async handleMessage(message: OuterMessage) {
    const decryptedCommand = message as DecryptedOuterMessage;
    if (decryptedCommand.command === "bw-handshake") {
      await this.handleDecryptedMessage(decryptedCommand);
    } else {
      await this.handleEncryptedMessage(message as EncryptedOuterMessage);
    }
  }

  private async handleDecryptedMessage(message: DecryptedOuterMessage) {
    const { messageId, payload } = message;
    const { publicKey } = payload;
    if (!publicKey) {
      ipcRenderer.send("nativeMessagingReply", {
        status: "canceled",
      });
      return;
    }

    const remotePublicKey = Utils.fromB64ToArray(publicKey).buffer;

    if (await this.stateService.getEnableDuckDuckGoBrowserIntegration()) {
      const secret = await this.cryptoFunctionService.randomBytes(64);
      this.ddgSharedSecret = new SymmetricCryptoKey(secret);
      const encryptedSecret = await this.cryptoFunctionService.rsaEncrypt(
        secret,
        remotePublicKey,
        EncryptionAlgorithm
      );
      await this.stateService.setDuckDuckGoSharedKey(Utils.fromBufferToB64(encryptedSecret));

      ipcRenderer.send("nativeMessagingReply", {
        messageId: messageId,
        version: 1,
        payload: {
          status: "success",
          sharedKey: Utils.fromBufferToB64(encryptedSecret),
        },
      });

      return;
    } else {
      ipcRenderer.send("nativeMessagingReply", {
        status: "canceled",
      });
    }
  }

  //TODO's for future messages
  private async handleEncryptedMessage(message: EncryptedOuterMessage) {
    //await this.decryptPayload(message.encryptedCommand);
  }

  private async encyptPayload(payload: any, key: SymmetricCryptoKey): Promise<EncString> {
    return await this.cryptoService.encrypt(JSON.stringify(payload), key);
  }

  private async decryptPayload(payload: EncString) {
    return await this.cryptoService.decryptToUtf8(payload, this.ddgSharedSecret);
  }
}
