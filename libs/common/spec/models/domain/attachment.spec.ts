import { Substitute, Arg } from "@fluffy-spoon/substitute";

import { AbstractEncryptService } from "@bitwarden/common/abstractions/abstractEncrypt.service";
import { CryptoService } from "@bitwarden/common/abstractions/crypto.service";
import { AttachmentData } from "@bitwarden/common/models/data/attachmentData";
import { Attachment } from "@bitwarden/common/models/domain/attachment";
import { SymmetricCryptoKey } from "@bitwarden/common/models/domain/symmetricCryptoKey";
import { ContainerService } from "@bitwarden/common/services/container.service";

import { makeStaticByteArray, mockEnc } from "../../utils";
import { EncString } from "@bitwarden/common/models/domain/encString";

describe("Attachment", () => {
  let data: AttachmentData;

  beforeEach(() => {
    data = {
      id: "id",
      url: "url",
      fileName: "fileName",
      key: "key",
      size: "1100",
      sizeName: "1.1 KB",
    };
  });

  it("Convert from empty", () => {
    const data = new AttachmentData();
    const attachment = new Attachment(data);

    expect(attachment).toEqual({
      id: null,
      url: null,
      size: undefined,
      sizeName: null,
      key: null,
      fileName: null,
    });
  });

  it("Convert", () => {
    const attachment = new Attachment(data);

    expect(attachment).toEqual({
      size: "1100",
      id: "id",
      url: "url",
      sizeName: "1.1 KB",
      fileName: { encryptedString: "fileName", encryptionType: 0 },
      key: { encryptedString: "key", encryptionType: 0 },
    });
  });

  it("toAttachmentData", () => {
    const attachment = new Attachment(data);
    expect(attachment.toAttachmentData()).toEqual(data);
  });

  describe("decrypt", () => {
    it("expected output", async () => {
      const attachment = new Attachment();
      attachment.id = "id";
      attachment.url = "url";
      attachment.size = "1100";
      attachment.sizeName = "1.1 KB";
      attachment.key = mockEnc("key");
      attachment.fileName = mockEnc("fileName");

      const cryptoService = Substitute.for<CryptoService>();
      cryptoService.getOrgKey(null).resolves(null);

      const encryptService = Substitute.for<AbstractEncryptService>();
      encryptService.decryptToBytes(Arg.any(), Arg.any()).resolves(makeStaticByteArray(32));

      (window as any).bitwardenContainerService = new ContainerService(
        cryptoService,
        encryptService
      );

      const view = await attachment.decrypt(null);

      expect(view).toEqual({
        id: "id",
        url: "url",
        size: "1100",
        sizeName: "1.1 KB",
        fileName: "fileName",
        key: expect.any(SymmetricCryptoKey),
      });
    });

    describe("decrypts attachment.key", () => {
      it("uses the provided key without depending on CryptoService", async () => {
        const providedKey = Substitute.for<SymmetricCryptoKey>();
        const cryptoService = Substitute.for<CryptoService>();
        const encryptService = Substitute.for<AbstractEncryptService>();

        const attachment = new Attachment();
        attachment.key = Substitute.for<EncString>();

        (window as any).bitwardenContainerService = new ContainerService(
          cryptoService,
          encryptService
        );

        await attachment.decrypt(null, providedKey);

        cryptoService.didNotReceive().getKeyForUserEncryption(Arg.any());
        encryptService.received(1).decryptToBytes(attachment.key, providedKey);
      });

      it("gets an organization key if required", async () => {
        const orgKey = Substitute.for<SymmetricCryptoKey>();
        const cryptoService = Substitute.for<CryptoService>();
        const encryptService = Substitute.for<AbstractEncryptService>();

        const attachment = new Attachment();
        attachment.key = Substitute.for<EncString>();

        cryptoService.getOrgKey("orgId").resolves(orgKey);

        (window as any).bitwardenContainerService = new ContainerService(
          cryptoService,
          encryptService
        );

        await attachment.decrypt("orgId", null);

        cryptoService.received(1).getOrgKey("orgId");
        encryptService.received(1).decryptToBytes(attachment.key, orgKey);
      });

      it("gets the user's decryption key if required", async () => {
        const userKey = Substitute.for<SymmetricCryptoKey>();
        const cryptoService = Substitute.for<CryptoService>();
        const encryptService = Substitute.for<AbstractEncryptService>();

        const attachment = new Attachment();
        attachment.key = Substitute.for<EncString>();

        cryptoService.getOrgKey(null).resolves(null);
        cryptoService.getKeyForUserEncryption().resolves(userKey);

        (window as any).bitwardenContainerService = new ContainerService(
          cryptoService,
          encryptService
        );

        await attachment.decrypt(null, null);

        cryptoService.received(1).getKeyForUserEncryption();
        encryptService.received(1).decryptToBytes(attachment.key, userKey);
      });
    });
  });
});
