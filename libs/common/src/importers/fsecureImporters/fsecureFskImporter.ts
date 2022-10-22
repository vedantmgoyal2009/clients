import { CipherType } from "../../enums/cipherType";
import { ImportResult } from "../../models/domain/import-result";
import { CardView } from "../../models/view/card.view";
import { BaseImporter } from "../baseImporter";
import { Importer } from "../importer";

import { FskEntryTypesEnum, FskFile } from "./types/fsecureFskTypes";

export class FSecureFskImporter extends BaseImporter implements Importer {
  parse(data: string): Promise<ImportResult> {
    const result = new ImportResult();
    const results: FskFile = JSON.parse(data);
    if (results == null || results.data == null) {
      result.success = false;
      return Promise.resolve(result);
    }

    for (const key in results.data) {
      // eslint-disable-next-line
      if (!results.data.hasOwnProperty(key)) {
        continue;
      }

      const value = results.data[key];
      const cipher = this.initLoginCipher();
      cipher.name = this.getValueOrDefault(value.service);
      cipher.notes = this.getValueOrDefault(value.notes);

      switch (value.type) {
        case FskEntryTypesEnum.Login:
          cipher.login.username = this.getValueOrDefault(value.username);
          cipher.login.password = this.getValueOrDefault(value.password);
          cipher.login.uris = this.makeUriArray(value.url);
          break;
        case FskEntryTypesEnum.CreditCard:
          cipher.type = CipherType.Card;
          cipher.card = new CardView();
          cipher.card.cardholderName = this.getValueOrDefault(value.username);
          cipher.card.number = this.getValueOrDefault(value.creditNumber);
          cipher.card.brand = this.getCardBrand(cipher.card.number);
          cipher.card.code = this.getValueOrDefault(value.creditCvv);
          if (!this.isNullOrWhitespace(value.creditExpiry)) {
            if (!this.setCardExpiration(cipher, value.creditExpiry)) {
              this.processKvp(cipher, "Expiration", value.creditExpiry);
            }
          }
          if (!this.isNullOrWhitespace(value.password)) {
            this.processKvp(cipher, "PIN", value.password);
          }
          break;
        default:
          continue;
          break;
      }

      this.convertToNoteIfNeeded(cipher);
      this.cleanupCipher(cipher);
      result.ciphers.push(cipher);
    }

    result.success = true;
    return Promise.resolve(result);
  }
}
