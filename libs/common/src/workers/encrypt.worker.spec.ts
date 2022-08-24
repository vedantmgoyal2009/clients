import { ContainerService } from "../services/container.service";

import { EncryptWorker } from "./encrypt.worker";

describe("EncryptWorker", () => {
  it("initialises services", () => {
    EncryptWorker.init();

    const containerService: ContainerService = (window as any).bitwardenContainerService;
    expect(() => containerService.getEncryptService()).not.toThrow();
    expect(containerService.getEncryptService()).toBeDefined();
  });

  describe("decryptCiphers", () => {
    it.todo("decrypts personal ciphers");
    it.todo("decrypts organisation ciphers");
  });
});
