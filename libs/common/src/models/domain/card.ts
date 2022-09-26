import { Jsonify } from "type-fest";

import { CardData } from "../data/cardData";
import { CardView } from "../view/cardView";

import Domain from "./domainBase";
import { EncString } from "./encString";
import { SymmetricCryptoKey } from "./symmetricCryptoKey";

export class Card extends Domain {
  cardholderName: EncString;
  brand: EncString;
  number: EncString;
  expMonth: EncString;
  expYear: EncString;
  code: EncString;

  constructor(obj?: CardData) {
    super();
    if (obj == null) {
      return;
    }

    this.buildDomainModel(
      this,
      obj,
      {
        cardholderName: null,
        brand: null,
        number: null,
        expMonth: null,
        expYear: null,
        code: null,
      },
      []
    );
  }

  decrypt(orgId: string, encKey?: SymmetricCryptoKey): Promise<CardView> {
    return this.decryptObj(
      new CardView(),
      {
        cardholderName: null,
        brand: null,
        number: null,
        expMonth: null,
        expYear: null,
        code: null,
      },
      orgId,
      encKey
    );
  }

  toCardData(): CardData {
    const c = new CardData();
    this.buildDataModel(this, c, {
      cardholderName: null,
      brand: null,
      number: null,
      expMonth: null,
      expYear: null,
      code: null,
    });
    return c;
  }

  static fromJSON(obj: Partial<Jsonify<Card>>): Card {
    const cardholderName =
      obj.cardholderName == null ? null : EncString.fromJSON(obj.cardholderName);
    const brand = obj.brand == null ? null : EncString.fromJSON(obj.brand);
    const number = obj.number == null ? null : EncString.fromJSON(obj.number);
    const expMonth = obj.expMonth == null ? null : EncString.fromJSON(obj.expMonth);
    const expYear = obj.expYear == null ? null : EncString.fromJSON(obj.expYear);
    const code = obj.code == null ? null : EncString.fromJSON(obj.code);
    return Object.assign(new Card(), obj, {
      cardholderName,
      brand,
      number,
      expMonth,
      expYear,
      code,
    });
  }
}
