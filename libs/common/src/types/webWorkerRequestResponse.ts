import { CipherData } from "../models/data/cipherData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";

export type WebWorkerRequest = DecryptCipherRequest;

export type DecryptCipherRequest = {
  id: string;
  type: "decryptCiphers";
  cipherData: { [id: string]: CipherData };
  localData: any;
  orgKeys: { [orgId: string]: SymmetricCryptoKey };
  userKey: SymmetricCryptoKey;
};

export type WebWorkerResponse = DecryptCipherResponse;

export type DecryptCipherResponse = {
  id: string;
  cipherViews: string;
};
