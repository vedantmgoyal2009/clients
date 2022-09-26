import { SymmetricCryptoKey } from "@bitwarden/common/models/domain";

export interface AbstractKeyGenerationService {
  makeEphemeralKey(numBytes?: number): Promise<SymmetricCryptoKey>;
}
