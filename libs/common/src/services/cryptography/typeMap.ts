import { Cipher } from "@bitwarden/common/models/domain/cipher";
import { CipherView } from "@bitwarden/common/models/view/cipherView";

/**
 * Internal reference of classes so we can reconstruct objects properly.
 * Each entry should be keyed using the IDecryptable.typeName string
 */
const typeMap = new Map<string, any>([
  ["Cipher", Cipher],
  ["CipherView", CipherView],
]);

export function getClass(className: string) {
  return typeMap.get(className);
}
