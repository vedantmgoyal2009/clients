import { Jsonify } from "type-fest";

import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

import { InitializerKey } from "./initializerKey";

/**
 * Internal reference of classes so we can reconstruct objects properly.
 * Each entry should be keyed using the IDecryptable.typeName string
 */

const classInitializers = {
  [InitializerKey.Cipher]: Cipher.fromJSON,
  [InitializerKey.CipherView]: CipherView.fromJSON,
};

export function getInitializer<T>(className: InitializerKey) {
  return classInitializers[className] as unknown as (obj: Jsonify<T>) => T;
}
