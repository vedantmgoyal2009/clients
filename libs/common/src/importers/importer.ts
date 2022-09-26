import { ImportResult } from "../models/domain";

export interface Importer {
  organizationId: string;
  parse(data: string): Promise<ImportResult>;
}
