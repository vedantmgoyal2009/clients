import { Jsonify } from "type-fest";

import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

/**
 * Internal reference of classes so we can reconstruct objects properly.
 * Each entry should be keyed using the IDecryptable.typeName string
 */

const classInitializers = {
  Cipher: Cipher.fromJSON,
  CipherView: CipherView.fromJSON,
};

export type InitializerKey = keyof typeof classInitializers;

export function getInitializer<T>(className: InitializerKey) {
  return classInitializers[className] as unknown as (obj: Jsonify<T>) => T;
}
