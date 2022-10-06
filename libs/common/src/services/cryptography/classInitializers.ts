import { Jsonify } from "type-fest";

import { Cipher } from "../../models/domain/cipher";
import { CipherView } from "../../models/view/cipherView";

import { InitializerKey } from "./initializerKey";

/**
 * Internal reference of classes so we can reconstruct objects properly.
 * Each entry should be keyed using the IDecryptable.initializerKey property
 */
const classInitializers: Record<InitializerKey, (obj: any) => any> = {
  [InitializerKey.Cipher]: Cipher.fromJSON,
  [InitializerKey.CipherView]: CipherView.fromJSON,
};

export function getInitializer<T>(className: InitializerKey): (obj: Jsonify<T>) => T {
  return classInitializers[className];
}
