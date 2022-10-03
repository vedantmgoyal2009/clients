import { InitializerKey } from "../services/cryptography/initializerKey";

/**
 * This interface enables deserialization of arbitrary objects by recording their class name in a format that will
 * survive serialization and can be matched to a constructor or factory method for deserialization.
 *
 */
export interface IInitializerMetadata {
  initializerKey: InitializerKey;
  toJSON?: () => { initializerKey: InitializerKey };
}
