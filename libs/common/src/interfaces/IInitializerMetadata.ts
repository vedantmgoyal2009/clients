import { InitializerKey } from "../services/cryptography/initializerKey";

/**
 * This interface enables deserialization of arbitrary objects by recording their class name as an enum, which
 * will survive serialization. The enum can then be matched to a constructor or factory method for deserialization.
 *
 */
export interface IInitializerMetadata {
  initializerKey: InitializerKey;
  toJSON?: () => { initializerKey: InitializerKey };
}
