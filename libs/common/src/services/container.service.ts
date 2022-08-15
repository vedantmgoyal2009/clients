import { AbstractEncryptService } from "../abstractions/abstractEncrypt.service";
import { CryptoService } from "../abstractions/crypto.service";

export class ContainerService {
  constructor(
    private cryptoService: CryptoService,
    private encryptService: AbstractEncryptService
  ) {}

  attachToGlobal(global: any) {
    if (!global.bitwardenContainerService) {
      global.bitwardenContainerService = this;
    }
  }

  getCryptoService(): CryptoService {
    return this.cryptoService;
  }

  getEncryptService(): AbstractEncryptService {
    return this.encryptService;
  }
}
