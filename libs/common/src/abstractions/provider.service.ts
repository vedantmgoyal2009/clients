import { ProviderData } from "../models/data";
import { Provider } from "../models/domain";

export abstract class ProviderService {
  get: (id: string) => Promise<Provider>;
  getAll: () => Promise<Provider[]>;
  save: (providers: { [id: string]: ProviderData }) => Promise<any>;
}
