import { ImportResult } from "../models/domain/importResult";

import { BaseImporter } from "./baseImporter";
import { Importer } from "./importer";

export class ChromeCsvImporter extends BaseImporter implements Importer {
  parse(data: string): Promise<ImportResult> {
    const result = new ImportResult();
    const results = this.parseCsv(data, true);
    if (results == null) {
      result.success = false;
      return Promise.resolve(result);
    }

    results.forEach((value) => {
      const cipher = this.initLoginCipher();
      const regex = new RegExp("(?<=@)(.*)(?=\\/)");
      let name = value.name;
      if (!name && regex.test(value.url)) {
        name = value.url.match(regex)[0];
      }
      cipher.name = this.getValueOrDefault(name, "--");
      cipher.login.username = this.getValueOrDefault(value.username);
      cipher.login.password = this.getValueOrDefault(value.password);
      cipher.login.uris = this.makeUriArray(value.url);
      this.cleanupCipher(cipher);
      result.ciphers.push(cipher);
    });

    result.success = true;
    return Promise.resolve(result);
  }
}
