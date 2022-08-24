import { CipherData } from "../models/data/cipherData";
import { LocalData } from "../models/data/localData";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

export type WebWorkerRequest = DecryptCipherRequest;

export type DecryptCipherRequest = {
  id: string;
  type: "decryptCiphers";
  cipherData: { [id: string]: CipherData };
  localData: { [cipherId: string]: LocalData };
  orgKeys: { [orgId: string]: SymmetricCryptoKey };
  userKey: SymmetricCryptoKey;
};

export type WebWorkerResponse = DecryptCipherResponse;

export type DecryptCipherResponse = {
  id: string;
  cipherViews: CipherView[];
};
