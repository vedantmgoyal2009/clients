import { AbstractEncryptWorkerService } from "@bitwarden/common/abstractions/encryptWorker.service";
import { EncryptWorkerService } from "@bitwarden/common/services/encryptWorker.service";

import { cryptoServiceFactory, CryptoServiceInitOptions } from "./crypto-service.factory";
import { CachedServices, factory, FactoryOptions } from "./factory-options";
import { logServiceFactory, LogServiceInitOptions } from "./log-service.factory";
import {
  platformUtilsServiceFactory,
  PlatformUtilsServiceInitOptions,
} from "./platform-utils-service.factory";

type EncryptWorkerServiceFactoryOptions = FactoryOptions & {
  encryptWorkerServiceOptions: {
    win: Window;
    encryptWorkerUrl: URL;
  };
};

export type EncryptWorkerServiceInitOptions = EncryptWorkerServiceFactoryOptions &
  LogServiceInitOptions &
  PlatformUtilsServiceInitOptions &
  CryptoServiceInitOptions;

export function EncryptWorkerServiceFactory(
  cache: { encryptWorkerService?: AbstractEncryptWorkerService } & CachedServices,
  opts: EncryptWorkerServiceInitOptions
): Promise<AbstractEncryptWorkerService> {
  return factory(
    cache,
    "encryptWorkerService",
    opts,
    async () =>
      new EncryptWorkerService(
        await logServiceFactory(cache, opts),
        await platformUtilsServiceFactory(cache, opts),
        opts.encryptWorkerServiceOptions.win,
        await cryptoServiceFactory(cache, opts),
        opts.encryptWorkerServiceOptions.encryptWorkerUrl
      )
  );
}
