import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";

import { CryptoFunctionService } from "../abstractions/cryptoFunction.service";
import { LogService } from "../abstractions/log.service";
import { IDecryptable } from "../interfaces/IDecryptable";

import { EncryptService } from "./cryptography/encrypt.service";

export class MultithreadEncryptService extends EncryptService {
  private worker: Worker;

  constructor(
    cryptoFunctionService: CryptoFunctionService,
    logService: LogService,
    logMacFailures: boolean,
    private createWorker: () => Worker
  ) {
    super(cryptoFunctionService, logService, logMacFailures);
  }

  async decryptItems<T>(
    items: IDecryptable<T>[],
    keys: SymmetricCryptoKey | Map<string, SymmetricCryptoKey>
  ): Promise<T[]> {
    // create worker
    // send request packet to worker
    // return result
    return;
  }
}
