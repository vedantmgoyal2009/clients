import { CipherService } from "@bitwarden/common/abstractions/cipher.service";
import { EventService } from "@bitwarden/common/abstractions/event.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { TotpService } from "@bitwarden/common/abstractions/totp.service";
import { CipherRepromptType } from "@bitwarden/common/enums/cipherRepromptType";
import { CipherType } from "@bitwarden/common/enums/cipherType";
import { EventType } from "@bitwarden/common/enums/eventType";
import { FieldType } from "@bitwarden/common/enums/fieldType";
import { CardView } from "@bitwarden/common/models/view/cardView";
import { CipherView } from "@bitwarden/common/models/view/cipherView";
import { FieldView } from "@bitwarden/common/models/view/fieldView";

import { BrowserApi } from "../browser/browserApi";
import AutofillField from "../models/autofillField";
import AutofillPageDetails from "../models/autofillPageDetails";
import AutofillScript from "../models/autofillScript";
import { StateService } from "../services/abstractions/state.service";

import {
  AutoFillOptions,
  AutofillService as AutofillServiceInterface,
  PageDetail,
  FormData,
} from "./abstractions/autofill.service";
import {
  AutoFillConstants,
  CreditCardAutoFillConstants,
  IdentityAutoFillConstants,
} from "./autofillConstants";

export interface GenerateFillScriptOptions {
  skipUsernameOnlyFill: boolean;
  onlyEmptyFields: boolean;
  onlyVisibleFields: boolean;
  fillNewPassword: boolean;
  cipher: CipherView;
}

export default class AutofillService implements AutofillServiceInterface {
  constructor(
    private cipherService: CipherService,
    private stateService: StateService,
    private totpService: TotpService,
    private eventService: EventService,
    private logService: LogService
  ) {}

  getFormsWithPasswordFields(pageDetails: AutofillPageDetails): FormData[] {
    const formData: FormData[] = [];

    const passwordFields = AutofillService.loadPasswordFields(
      pageDetails,
      true,
      true,
      false,
      false
    );
    if (passwordFields.length === 0) {
      return formData;
    }

    for (const formKey in pageDetails.forms) {
      // eslint-disable-next-line
      if (!pageDetails.forms.hasOwnProperty(formKey)) {
        continue;
      }

      const formPasswordFields = passwordFields.filter((pf) => formKey === pf.form);
      if (formPasswordFields.length > 0) {
        let uf = this.findUsernameField(pageDetails, formPasswordFields[0], false, false, false);
        if (uf == null) {
          // not able to find any viewable username fields. maybe there are some "hidden" ones?
          uf = this.findUsernameField(pageDetails, formPasswordFields[0], true, true, false);
        }
        formData.push({
          form: pageDetails.forms[formKey],
          password: formPasswordFields[0],
          username: uf,
          passwords: formPasswordFields,
        });
      }
    }

    return formData;
  }

  async doAutoFill(options: AutoFillOptions) {
    const tab = options.tab;
    if (!tab || !options.cipher || !options.pageDetails || !options.pageDetails.length) {
      throw new Error("Nothing to auto-fill.");
    }

    let totpPromise: Promise<string> = null;

    const canAccessPremium = await this.stateService.getCanAccessPremium();
    let didAutofill = false;
    options.pageDetails.forEach((pd) => {
      // make sure we're still on correct tab
      if (pd.tab.id !== tab.id || pd.tab.url !== tab.url) {
        return;
      }

      const fillScript = this.generateFillScript(pd.details, {
        skipUsernameOnlyFill: options.skipUsernameOnlyFill || false,
        onlyEmptyFields: options.onlyEmptyFields || false,
        onlyVisibleFields: options.onlyVisibleFields || false,
        fillNewPassword: options.fillNewPassword || false,
        cipher: options.cipher,
      });

      if (!fillScript || !fillScript.script || !fillScript.script.length) {
        return;
      }

      // Add a small delay between operations
      fillScript.properties.delay_between_operations = 20;

      didAutofill = true;
      if (!options.skipLastUsed) {
        this.cipherService.updateLastUsedDate(options.cipher.id);
      }

      BrowserApi.tabSendMessage(
        tab,
        {
          command: "fillForm",
          fillScript: fillScript,
          url: tab.url,
        },
        { frameId: pd.frameId }
      );

      if (
        options.cipher.type !== CipherType.Login ||
        totpPromise ||
        !options.cipher.login.totp ||
        (!canAccessPremium && !options.cipher.organizationUseTotp)
      ) {
        return;
      }

      totpPromise = this.stateService.getDisableAutoTotpCopy().then((disabled) => {
        if (!disabled) {
          return this.totpService.getCode(options.cipher.login.totp);
        }
        return null;
      });
    });

    if (didAutofill) {
      this.eventService.collect(EventType.Cipher_ClientAutofilled, options.cipher.id);
      if (totpPromise != null) {
        return await totpPromise;
      } else {
        return null;
      }
    } else {
      throw new Error("Did not auto-fill.");
    }
  }

  async doAutoFillOnTab(pageDetails: PageDetail[], tab: chrome.tabs.Tab, fromCommand: boolean) {
    let cipher: CipherView;
    if (fromCommand) {
      cipher = await this.cipherService.getNextCipherForUrl(tab.url);
    } else {
      const lastLaunchedCipher = await this.cipherService.getLastLaunchedForUrl(tab.url, true);
      if (
        lastLaunchedCipher &&
        Date.now().valueOf() - lastLaunchedCipher.localData?.lastLaunched?.valueOf() < 30000
      ) {
        cipher = lastLaunchedCipher;
      } else {
        cipher = await this.cipherService.getLastUsedForUrl(tab.url, true);
      }

      if (cipher == null) {
        return null;
      }
    }

    if (cipher.reprompt !== CipherRepromptType.None) {
      return;
    }

    const totpCode = await this.doAutoFill({
      tab: tab,
      cipher: cipher,
      pageDetails: pageDetails,
      skipLastUsed: !fromCommand,
      skipUsernameOnlyFill: !fromCommand,
      onlyEmptyFields: !fromCommand,
      onlyVisibleFields: !fromCommand,
      fillNewPassword: fromCommand,
    });

    // Update last used index as autofill has succeed
    if (fromCommand) {
      this.cipherService.updateLastUsedIndexForUrl(tab.url);
    }

    return totpCode;
  }

  async doAutoFillActiveTab(pageDetails: PageDetail[], fromCommand: boolean) {
    const tab = await this.getActiveTab();
    if (!tab || !tab.url) {
      return;
    }

    return await this.doAutoFillOnTab(pageDetails, tab, fromCommand);
  }

  // Helpers

  private async getActiveTab(): Promise<chrome.tabs.Tab> {
    const tab = await BrowserApi.getTabFromCurrentWindow();
    if (!tab) {
      throw new Error("No tab found.");
    }

    return tab;
  }

  private generateFillScript(
    pageDetails: AutofillPageDetails,
    options: GenerateFillScriptOptions
  ): AutofillScript {
    if (!pageDetails || !options.cipher) {
      return null;
    }

    let fillScript = new AutofillScript(pageDetails.documentUUID);
    let filledFields: { [id: string]: AutofillField } = {};

    filledFields = this.generateCipherFieldsFillScript(fillScript, pageDetails, options);

    switch (options.cipher.type) {
      case CipherType.Login:
        fillScript = this.generateLoginFillScript(fillScript, pageDetails, filledFields, options);
        break;
      case CipherType.Card:
        fillScript = this.generateCardFillScript(fillScript, pageDetails, filledFields, options);
        break;
      case CipherType.Identity:
        fillScript = this.generateIdentityFillScript(
          fillScript,
          pageDetails,
          filledFields,
          options
        );
        break;
      default:
        return null;
    }

    return fillScript;
  }

  private generateCipherFieldsFillScript(
    fillScript: AutofillScript,
    pageDetails: AutofillPageDetails,
    options: GenerateFillScriptOptions
  ): { [id: string]: AutofillField } {
    const fields = options.cipher.fields;
    const filledFields: { [id: string]: AutofillField } = {};

    if (fields && fields.length) {
      const cipherFieldNames: string[] = [];

      fields.forEach((f) => {
        if (AutofillService.hasValue(f.name)) {
          cipherFieldNames.push(f.name.toLowerCase());
        }
      });

      pageDetails.fields.forEach((field) => {
        // eslint-disable-next-line
        if (filledFields.hasOwnProperty(field.opid)) {
          return;
        }

        if (!field.viewable && field.tagName !== "span") {
          return;
        }

        const matchingIndex = this.findMatchingFieldIndex(field, cipherFieldNames);
        if (matchingIndex > -1) {
          const matchingField: FieldView = fields[matchingIndex];
          let val: string;
          if (matchingField.type === FieldType.Linked) {
            // Assumption: Linked Field is not being used to autofill a boolean value
            val = options.cipher.linkedFieldValue(matchingField.linkedId) as string;
          } else {
            val = matchingField.value;
            if (val == null && matchingField.type === FieldType.Boolean) {
              val = "false";
            }
          }

          filledFields[field.opid] = field;
          AutofillService.fillByOpid(fillScript, field, val);
        }
      });
    }

    return filledFields;
  }

  private generateLoginFillScript(
    fillScript: AutofillScript,
    pageDetails: AutofillPageDetails,
    filledFields: { [id: string]: AutofillField },
    options: GenerateFillScriptOptions
  ): AutofillScript {
    if (!options.cipher.login) {
      return null;
    }

    const passwords: AutofillField[] = [];
    const usernames: AutofillField[] = [];
    let pf: AutofillField = null;
    let username: AutofillField = null;
    const login = options.cipher.login;

    if (!login.password || login.password === "") {
      // No password for this login. Maybe they just wanted to auto-fill some custom fields?
      fillScript = AutofillService.setFillScriptForFocus(filledFields, fillScript);
      return fillScript;
    }

    let passwordFields = AutofillService.loadPasswordFields(
      pageDetails,
      false,
      false,
      options.onlyEmptyFields,
      options.fillNewPassword
    );
    if (!passwordFields.length && !options.onlyVisibleFields) {
      // not able to find any viewable password fields. maybe there are some "hidden" ones?
      passwordFields = AutofillService.loadPasswordFields(
        pageDetails,
        true,
        true,
        options.onlyEmptyFields,
        options.fillNewPassword
      );
    }

    for (const formKey in pageDetails.forms) {
      // eslint-disable-next-line
      if (!pageDetails.forms.hasOwnProperty(formKey)) {
        continue;
      }

      // This is not used anywhere.
      // const passwordFieldsForForm: AutofillField[] = [];
      // passwordFields.forEach((passField) => {
      //   if (formKey === passField.form) {
      //     passwordFieldsForForm.push(passField);
      //   }
      // });

      passwordFields.forEach((passField) => {
        pf = passField;
        passwords.push(pf);

        if (login.username) {
          username = this.findUsernameField(pageDetails, pf, false, false, false);

          if (!username && !options.onlyVisibleFields) {
            // not able to find any viewable username fields. maybe there are some "hidden" ones?
            username = this.findUsernameField(pageDetails, pf, true, true, false);
          }

          if (username) {
            usernames.push(username);
          }
        }
      });
    }

    if (passwordFields.length && !passwords.length) {
      // The page does not have any forms with password fields. Use the first password field on the page and the
      // input field just before it as the username.

      pf = passwordFields[0];
      passwords.push(pf);

      if (login.username && pf.elementNumber > 0) {
        username = this.findUsernameField(pageDetails, pf, false, false, true);

        if (!username && !options.onlyVisibleFields) {
          // not able to find any viewable username fields. maybe there are some "hidden" ones?
          username = this.findUsernameField(pageDetails, pf, true, true, true);
        }

        if (username) {
          usernames.push(username);
        }
      }
    }

    if (!passwordFields.length && !options.skipUsernameOnlyFill) {
      // No password fields on this page. Let's try to just fuzzy fill the username.
      pageDetails.fields.forEach((f) => {
        if (
          f.viewable &&
          (f.type === "text" || f.type === "email" || f.type === "tel") &&
          AutofillService.fieldIsFuzzyMatch(f, AutoFillConstants.UsernameFieldNames)
        ) {
          usernames.push(f);
        }
      });
    }

    usernames.forEach((u) => {
      // eslint-disable-next-line
      if (filledFields.hasOwnProperty(u.opid)) {
        return;
      }

      filledFields[u.opid] = u;
      AutofillService.fillByOpid(fillScript, u, login.username);
    });

    passwords.forEach((p) => {
      // eslint-disable-next-line
      if (filledFields.hasOwnProperty(p.opid)) {
        return;
      }

      filledFields[p.opid] = p;
      AutofillService.fillByOpid(fillScript, p, login.password);
    });

    fillScript = AutofillService.setFillScriptForFocus(filledFields, fillScript);
    return fillScript;
  }

  private generateCardFillScript(
    fillScript: AutofillScript,
    pageDetails: AutofillPageDetails,
    filledFields: { [id: string]: AutofillField },
    options: GenerateFillScriptOptions
  ): AutofillScript {
    if (!options.cipher.card) {
      return null;
    }

    let fillFields: { [id: string]: AutofillField } = {};

    fillFields = this.mapPageDetailsToCardFillFields(pageDetails);

    const card = options.cipher.card;
    this.makeScriptAction(fillScript, card, fillFields, filledFields, "cardholderName");
    this.makeScriptAction(fillScript, card, fillFields, filledFields, "number");
    this.makeScriptAction(fillScript, card, fillFields, filledFields, "code");
    this.makeScriptAction(fillScript, card, fillFields, filledFields, "brand");

    if (fillFields.expMonth && AutofillService.hasValue(card.expMonth)) {
      this.fillCardExpirationMonth(fillScript, fillFields, card, filledFields);
    }

    if (fillFields.expYear && AutofillService.hasValue(card.expYear)) {
      this.fillCardExpirationYear(fillScript, fillFields, card, filledFields);
    }

    if (
      fillFields.exp &&
      AutofillService.hasValue(card.expMonth) &&
      AutofillService.hasValue(card.expYear)
    ) {
      this.fillCardExpirationWithSingleField(fillScript, fillFields, card, filledFields);
    }

    return fillScript;
  }

  private mapPageDetailsToCardFillFields(pageDetails: AutofillPageDetails): {
    [id: string]: AutofillField;
  } {
    const fillFields: { [id: string]: AutofillField } = {};

    pageDetails.fields.forEach((f) => {
      if (AutofillService.forCustomFieldsOnly(f)) {
        return;
      }

      if (this.isExcludedType(f.type, AutoFillConstants.ExcludedAutofillTypes)) {
        return;
      }

      for (let i = 0; i < CreditCardAutoFillConstants.CardAttributes.length; i++) {
        const attr = CreditCardAutoFillConstants.CardAttributes[i];
        // eslint-disable-next-line
        if (!f.hasOwnProperty(attr) || !f[attr] || !f.viewable) {
          continue;
        }

        // ref https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
        // ref https://developers.google.com/web/fundamentals/design-and-ux/input/forms/
        if (
          !fillFields.cardholderName &&
          AutofillService.isFieldMatch(
            f[attr],
            CreditCardAutoFillConstants.CardHolderFieldNames,
            CreditCardAutoFillConstants.CardHolderFieldNameValues
          )
        ) {
          fillFields.cardholderName = f;
          break;
        } else if (
          !fillFields.number &&
          AutofillService.isFieldMatch(
            f[attr],
            CreditCardAutoFillConstants.CardNumberFieldNames,
            CreditCardAutoFillConstants.CardNumberFieldNameValues
          )
        ) {
          fillFields.number = f;
          break;
        } else if (
          !fillFields.exp &&
          AutofillService.isFieldMatch(
            f[attr],
            CreditCardAutoFillConstants.CardExpiryFieldNames,
            CreditCardAutoFillConstants.CardExpiryFieldNameValues
          )
        ) {
          fillFields.exp = f;
          break;
        } else if (
          !fillFields.expMonth &&
          AutofillService.isFieldMatch(f[attr], CreditCardAutoFillConstants.ExpiryMonthFieldNames)
        ) {
          fillFields.expMonth = f;
          break;
        } else if (
          !fillFields.expYear &&
          AutofillService.isFieldMatch(f[attr], CreditCardAutoFillConstants.ExpiryYearFieldNames)
        ) {
          fillFields.expYear = f;
          break;
        } else if (
          !fillFields.code &&
          AutofillService.isFieldMatch(f[attr], CreditCardAutoFillConstants.CVVFieldNames)
        ) {
          fillFields.code = f;
          break;
        } else if (
          !fillFields.brand &&
          AutofillService.isFieldMatch(f[attr], CreditCardAutoFillConstants.CardBrandFieldNames)
        ) {
          fillFields.brand = f;
          break;
        }
      }
    });

    return fillFields;
  }

  private fillCardExpirationMonth(
    fillScript: AutofillScript,
    fillFields: { [id: string]: AutofillField },
    card: CardView,
    filledFields: { [id: string]: AutofillField }
  ) {
    let expMonth: string = card.expMonth;

    if (fillFields.expMonth.selectInfo && fillFields.expMonth.selectInfo.options) {
      expMonth = this.updateCardExpirationMonthValueFromSelectControl(fillFields, card);
    } else {
      expMonth = this.padCardExpirationMonthIfNecessary(fillFields.expMonth, card);
    }

    filledFields[fillFields.expMonth.opid] = fillFields.expMonth;
    AutofillService.fillByOpid(fillScript, fillFields.expMonth, expMonth);
  }

  private padCardExpirationMonthIfNecessary(monthField: AutofillField, card: CardView): string {
    let result: string = card.expMonth;
    if (
      (this.cardFieldAttributesContain(monthField, "mm") || monthField.maxLength === 2) &&
      card.expMonth.length === 1
    ) {
      result = "0" + card.expMonth;
    }
    return result;
  }

  private updateCardExpirationMonthValueFromSelectControl(
    fillFields: { [id: string]: AutofillField },
    card: CardView
  ) {
    let result: string = card.expMonth;
    let index: number = null;
    const siOptions = fillFields.expMonth.selectInfo.options;
    if (siOptions.length === 12) {
      index = parseInt(card.expMonth, null) - 1;
    } else if (siOptions.length === 13) {
      if (
        siOptions[0][0] != null &&
        siOptions[0][0] !== "" &&
        (siOptions[12][0] == null || siOptions[12][0] === "")
      ) {
        index = parseInt(card.expMonth, null) - 1;
      } else {
        index = parseInt(card.expMonth, null);
      }
    }

    if (index != null) {
      const option = siOptions[index];
      if (option.length > 1) {
        result = option[1];
      }
    }
    return result;
  }

  private fillCardExpirationYear(
    fillScript: AutofillScript,
    fillFields: { [id: string]: AutofillField },
    card: CardView,
    filledFields: { [id: string]: AutofillField }
  ) {
    let expYear: string = card.expYear;
    if (fillFields.expYear.selectInfo && fillFields.expYear.selectInfo.options) {
      expYear = this.updateCardExpirationYearValueFromSelectControl(fillFields, card);
    } else {
      expYear = this.padCardExpirationYearIfNecessary(fillFields.expYear, card);
    }

    filledFields[fillFields.expYear.opid] = fillFields.expYear;
    AutofillService.fillByOpid(fillScript, fillFields.expYear, expYear);
  }

  private updateCardExpirationYearValueFromSelectControl(
    fillFields: { [id: string]: AutofillField },
    card: CardView
  ): string {
    let result: string = card.expYear;
    for (let i = 0; i < fillFields.expYear.selectInfo.options.length; i++) {
      const o: [string, string] = fillFields.expYear.selectInfo.options[i];
      if (o[0] === card.expYear || o[1] === card.expYear) {
        result = o[1];
        break;
      }
      if (o[1].length === 2 && card.expYear.length === 4 && o[1] === card.expYear.substring(2)) {
        result = o[1];
        break;
      }
      const colonIndex = o[1].indexOf(":");
      if (colonIndex > -1 && o[1].length > colonIndex + 1) {
        const val = o[1].substring(colonIndex + 2);
        if (val != null && val.trim() !== "" && val === card.expYear) {
          result = o[1];
          break;
        }
      }
    }
    return result;
  }

  private padCardExpirationYearIfNecessary(yearField: AutofillField, card: CardView): string {
    let result: string = card.expYear;
    if (
      (this.cardFieldAttributesContain(yearField, "yyyy") || yearField.maxLength === 4) &&
      card.expYear.length === 2
    ) {
      result = "20" + card.expYear;
    } else if (
      (this.cardFieldAttributesContain(yearField, "yy") || yearField.maxLength === 2) &&
      card.expYear.length === 4
    ) {
      result = card.expYear.substr(2);
    }
    return result;
  }

  private fillCardExpirationWithSingleField(
    fillScript: AutofillScript,
    fillFields: { [id: string]: AutofillField },
    card: CardView,
    filledFields: { [id: string]: AutofillField }
  ) {
    const fullMonth = ("0" + card.expMonth).slice(-2);

    let fullYear: string = card.expYear;
    let partYear: string = null;
    if (fullYear.length === 2) {
      partYear = fullYear;
      fullYear = "20" + fullYear;
    } else if (fullYear.length === 4) {
      partYear = fullYear.substr(2, 2);
    }

    let exp: string = null;
    for (let i = 0; i < CreditCardAutoFillConstants.MonthAbbr.length; i++) {
      if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.MonthAbbr[i] +
            "/" +
            CreditCardAutoFillConstants.YearAbbrShort[i]
        ) &&
        partYear != null
      ) {
        exp = fullMonth + "/" + partYear;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.MonthAbbr[i] +
            "/" +
            CreditCardAutoFillConstants.YearAbbrLong[i]
        )
      ) {
        exp = fullMonth + "/" + fullYear;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.YearAbbrShort[i] +
            "/" +
            CreditCardAutoFillConstants.MonthAbbr[i]
        ) &&
        partYear != null
      ) {
        exp = partYear + "/" + fullMonth;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.YearAbbrLong[i] +
            "/" +
            CreditCardAutoFillConstants.MonthAbbr[i]
        )
      ) {
        exp = fullYear + "/" + fullMonth;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.MonthAbbr[i] +
            "-" +
            CreditCardAutoFillConstants.YearAbbrShort[i]
        ) &&
        partYear != null
      ) {
        exp = fullMonth + "-" + partYear;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.MonthAbbr[i] +
            "-" +
            CreditCardAutoFillConstants.YearAbbrLong[i]
        )
      ) {
        exp = fullMonth + "-" + fullYear;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.YearAbbrShort[i] +
            "-" +
            CreditCardAutoFillConstants.MonthAbbr[i]
        ) &&
        partYear != null
      ) {
        exp = partYear + "-" + fullMonth;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.YearAbbrLong[i] +
            "-" +
            CreditCardAutoFillConstants.MonthAbbr[i]
        )
      ) {
        exp = fullYear + "-" + fullMonth;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.YearAbbrShort[i] + CreditCardAutoFillConstants.MonthAbbr[i]
        ) &&
        partYear != null
      ) {
        exp = partYear + fullMonth;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.YearAbbrLong[i] + CreditCardAutoFillConstants.MonthAbbr[i]
        )
      ) {
        exp = fullYear + fullMonth;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.MonthAbbr[i] + CreditCardAutoFillConstants.YearAbbrShort[i]
        ) &&
        partYear != null
      ) {
        exp = fullMonth + partYear;
      } else if (
        this.cardFieldAttributesContain(
          fillFields.exp,
          CreditCardAutoFillConstants.MonthAbbr[i] + CreditCardAutoFillConstants.YearAbbrLong[i]
        )
      ) {
        exp = fullMonth + fullYear;
      }

      if (exp != null) {
        break;
      }
    }

    if (exp == null) {
      exp = fullYear + "-" + fullMonth;
    }

    this.makeScriptActionWithValue(fillScript, exp, fillFields.exp, filledFields);
  }

  // Check the card-specific attributes of the field to see if any of the attributes have the specified value
  private cardFieldAttributesContain(field: AutofillField, containsVal: string): boolean {
    if (!field) {
      return false;
    }

    let doesContain = false;
    CreditCardAutoFillConstants.CardAttributesExtended.forEach((attr) => {
      // eslint-disable-next-line
      if (doesContain || !field.hasOwnProperty(attr) || !field[attr]) {
        return;
      }

      let val = field[attr];
      val = val.replace(/ /g, "").toLowerCase();
      doesContain = val.indexOf(containsVal) > -1;
    });

    return doesContain;
  }

  private generateIdentityFillScript(
    fillScript: AutofillScript,
    pageDetails: AutofillPageDetails,
    filledFields: { [id: string]: AutofillField },
    options: GenerateFillScriptOptions
  ): AutofillScript {
    if (!options.cipher.identity) {
      return null;
    }

    let fillFields: { [id: string]: AutofillField } = {};

    fillFields = this.mapPageDetailsToIdentityFillFields(pageDetails);

    const identity = options.cipher.identity;
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "title");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "firstName");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "middleName");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "lastName");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "address1");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "address2");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "address3");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "city");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "postalCode");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "company");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "email");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "phone");
    this.makeScriptAction(fillScript, identity, fillFields, filledFields, "username");

    let filledState = false;
    if (fillFields.state && identity.state && identity.state.length > 2) {
      const stateLower = identity.state.toLowerCase();
      const isoState =
        IdentityAutoFillConstants.IsoStates[stateLower] ||
        IdentityAutoFillConstants.IsoProvinces[stateLower];
      if (isoState) {
        filledState = true;
        this.makeScriptActionWithValue(fillScript, isoState, fillFields.state, filledFields);
      }
    }

    if (!filledState) {
      this.makeScriptAction(fillScript, identity, fillFields, filledFields, "state");
    }

    let filledCountry = false;
    if (fillFields.country && identity.country && identity.country.length > 2) {
      const countryLower = identity.country.toLowerCase();
      const isoCountry = IdentityAutoFillConstants.IsoCountries[countryLower];
      if (isoCountry) {
        filledCountry = true;
        this.makeScriptActionWithValue(fillScript, isoCountry, fillFields.country, filledFields);
      }
    }

    if (!filledCountry) {
      this.makeScriptAction(fillScript, identity, fillFields, filledFields, "country");
    }

    if (fillFields.name && (identity.firstName || identity.lastName)) {
      let fullName = "";
      if (AutofillService.hasValue(identity.firstName)) {
        fullName = identity.firstName;
      }
      if (AutofillService.hasValue(identity.middleName)) {
        if (fullName !== "") {
          fullName += " ";
        }
        fullName += identity.middleName;
      }
      if (AutofillService.hasValue(identity.lastName)) {
        if (fullName !== "") {
          fullName += " ";
        }
        fullName += identity.lastName;
      }

      this.makeScriptActionWithValue(fillScript, fullName, fillFields.name, filledFields);
    }

    if (fillFields.address && AutofillService.hasValue(identity.address1)) {
      let address = "";
      if (AutofillService.hasValue(identity.address1)) {
        address = identity.address1;
      }
      if (AutofillService.hasValue(identity.address2)) {
        if (address !== "") {
          address += ", ";
        }
        address += identity.address2;
      }
      if (AutofillService.hasValue(identity.address3)) {
        if (address !== "") {
          address += ", ";
        }
        address += identity.address3;
      }

      this.makeScriptActionWithValue(fillScript, address, fillFields.address, filledFields);
    }

    return fillScript;
  }

  private mapPageDetailsToIdentityFillFields(pageDetails: AutofillPageDetails): {
    [id: string]: AutofillField;
  } {
    const fillFields: { [id: string]: AutofillField } = {};

    pageDetails.fields.forEach((fieldOnPage) => {
      if (AutofillService.forCustomFieldsOnly(fieldOnPage)) {
        return;
      }

      if (this.isExcludedType(fieldOnPage.type, AutoFillConstants.ExcludedAutofillTypes)) {
        return;
      }

      for (
        let fieldAttributeIndex = 0;
        fieldAttributeIndex < IdentityAutoFillConstants.IdentityAttributes.length;
        fieldAttributeIndex++
      ) {
        const fieldAttribute = IdentityAutoFillConstants.IdentityAttributes[fieldAttributeIndex];

        if (
          !fieldOnPage.hasOwn(fieldAttribute) ||
          !fieldOnPage[fieldAttribute] ||
          !fieldOnPage.viewable
        ) {
          continue;
        }

        // ref https://html.spec.whatwg.org/multipage/form-control-infrastructure.html#autofill
        // ref https://developers.google.com/web/fundamentals/design-and-ux/input/forms/
        if (
          !fillFields.name &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.FullNameFieldNames,
            IdentityAutoFillConstants.FullNameFieldNameValues
          )
        ) {
          fillFields.name = fieldOnPage;
          break;
        } else if (
          !fillFields.firstName &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.FirstnameFieldNames
          )
        ) {
          fillFields.firstName = fieldOnPage;
          break;
        } else if (
          !fillFields.middleName &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.MiddlenameFieldNames
          )
        ) {
          fillFields.middleName = fieldOnPage;
          break;
        } else if (
          !fillFields.lastName &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.LastnameFieldNames
          )
        ) {
          fillFields.lastName = fieldOnPage;
          break;
        } else if (
          !fillFields.title &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.TitleFieldNames
          )
        ) {
          fillFields.title = fieldOnPage;
          break;
        } else if (
          !fillFields.email &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.EmailFieldNames
          )
        ) {
          fillFields.email = fieldOnPage;
          break;
        } else if (
          !fillFields.address &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.AddressFieldNames,
            IdentityAutoFillConstants.AddressFieldNameValues
          )
        ) {
          fillFields.address = fieldOnPage;
          break;
        } else if (
          !fillFields.address1 &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.Address1FieldNames
          )
        ) {
          fillFields.address1 = fieldOnPage;
          break;
        } else if (
          !fillFields.address2 &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.Address2FieldNames
          )
        ) {
          fillFields.address2 = fieldOnPage;
          break;
        } else if (
          !fillFields.address3 &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.Address3FieldNames
          )
        ) {
          fillFields.address3 = fieldOnPage;
          break;
        } else if (
          !fillFields.postalCode &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.PostalCodeFieldNames
          )
        ) {
          fillFields.postalCode = fieldOnPage;
          break;
        } else if (
          !fillFields.city &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.CityFieldNames
          )
        ) {
          fillFields.city = fieldOnPage;
          break;
        } else if (
          !fillFields.state &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.StateFieldNames
          )
        ) {
          fillFields.state = fieldOnPage;
          break;
        } else if (
          !fillFields.country &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.CountryFieldNames
          )
        ) {
          fillFields.country = fieldOnPage;
          break;
        } else if (
          !fillFields.phone &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.PhoneFieldNames
          )
        ) {
          fillFields.phone = fieldOnPage;
          break;
        } else if (
          !fillFields.username &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.UserNameFieldNames
          )
        ) {
          fillFields.username = fieldOnPage;
          break;
        } else if (
          !fillFields.company &&
          AutofillService.isFieldMatch(
            fieldOnPage[fieldAttribute],
            IdentityAutoFillConstants.CompanyFieldNames
          )
        ) {
          fillFields.company = fieldOnPage;
          break;
        }
      }
    });

    return fillFields;
  }

  private isExcludedType(type: string, excludedTypes: string[]) {
    return excludedTypes.indexOf(type) > -1;
  }

  /**
   * Checks to see if the field attribute value passed in matches the options provided, either with an exact match or optional partial match.
   * Ignores case or spaces when doing the matches.
   * @param {string} value - The value of the attribute of a field on the page (e.g. if the page element HTML has id='userFirstName', the value is 'userFirstName')
   * @param {string[]} options - The context-specific field names that we are looking to EXACT match against the `value` input (e.g. { 'name, 'firstName', etc. })
   * @param {string[]} containsOptions - The optional context-specific field names that we will match if the input value CONTAINS any matches.
   */
  private static isFieldMatch(
    value: string,
    options: string[],
    containsOptions?: string[]
  ): boolean {
    value = value
      .trim()
      .toLowerCase()
      .replace(/[^a-zA-Z0-9]+/g, "");
    for (let i = 0; i < options.length; i++) {
      let option = options[i];
      const checkValueContains = containsOptions == null || containsOptions.indexOf(option) > -1;
      option = option.toLowerCase().replace(/-/g, "");
      if (value === option || (checkValueContains && value.indexOf(option) > -1)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Handles cases where the field data is presented as a select element with values for the user to pick. We must attempt to fill based on matching the data value with the options presented.
   * Provides syntactic sugar to select the method from the cipherData[] and fillFields[] arrays based on the property name passed in.
   */
  private makeScriptAction(
    fillScript: AutofillScript,
    cipherData: any,
    fillFields: { [id: string]: AutofillField },
    filledFields: { [id: string]: AutofillField },
    dataProp: string
  ) {
    this.makeScriptActionWithValue(
      fillScript,
      cipherData[dataProp],
      fillFields[dataProp],
      filledFields
    );
  }

  /**
   * Handles cases where the field data is presented as a select element with values for the user to pick.
   * We must attempt to fill based on matching the data value with the options presented.
   */
  private makeScriptActionWithValue(
    fillScript: AutofillScript,
    dataValue: any,
    field: AutofillField,
    filledFields: { [id: string]: AutofillField }
  ) {
    let doFill = false;
    if (AutofillService.hasValue(dataValue) && field) {
      if (field.type === "select-one" && field.selectInfo && field.selectInfo.options) {
        // The selectInfo.options is a two-dimensional array of [ option text, option value ].
        // First, loop through each option text.
        for (let optionText = 0; optionText < field.selectInfo.options.length; optionText++) {
          const option = field.selectInfo.options[optionText];
          // Now, for each option text, loop through the option values.
          for (let optionValue = 0; optionValue < option.length; optionValue++) {
            // If this option value on the page matches the data value, we have our match
            if (
              AutofillService.hasValue(option[optionValue]) &&
              option[optionValue].toLowerCase() === dataValue.toLowerCase()
            ) {
              doFill = true;
              if (option.length > 1) {
                dataValue = option[1];
              }
              break;
            }
          }

          if (doFill) {
            break;
          }
        }
      } else {
        doFill = true;
      }
    }

    if (doFill) {
      filledFields[field.opid] = field;
      AutofillService.fillByOpid(fillScript, field, dataValue);
    }
  }

  static loadPasswordFields(
    pageDetails: AutofillPageDetails,
    canBeHidden: boolean,
    canBeReadOnly: boolean,
    mustBeEmpty: boolean,
    fillNewPassword: boolean
  ) {
    const arr: AutofillField[] = [];
    pageDetails.fields.forEach((f) => {
      if (AutofillService.forCustomFieldsOnly(f)) {
        return;
      }

      const isPassword = f.type === "password";
      const valueIsLikePassword = (value: string) => {
        if (value == null) {
          return false;
        }
        // Removes all whitespace, _ and - characters
        // eslint-disable-next-line
        const cleanedValue = value.toLowerCase().replace(/[\s_\-]/g, "");

        if (cleanedValue.indexOf("password") < 0) {
          return false;
        }

        if (AutoFillConstants.PasswordFieldIgnoreList.some((i) => cleanedValue.indexOf(i) > -1)) {
          return false;
        }

        return true;
      };
      const isLikePassword = () => {
        if (f.type !== "text") {
          return false;
        }
        if (valueIsLikePassword(f.htmlID)) {
          return true;
        }
        if (valueIsLikePassword(f.htmlName)) {
          return true;
        }
        if (valueIsLikePassword(f.placeholder)) {
          return true;
        }
        return false;
      };
      if (
        !f.disabled &&
        (canBeReadOnly || !f.readonly) &&
        (isPassword || isLikePassword()) &&
        (canBeHidden || f.viewable) &&
        (!mustBeEmpty || f.value == null || f.value.trim() === "") &&
        (fillNewPassword || f.autoCompleteType !== "new-password")
      ) {
        arr.push(f);
      }
    });
    return arr;
  }

  private findUsernameField(
    pageDetails: AutofillPageDetails,
    passwordField: AutofillField,
    canBeHidden: boolean,
    canBeReadOnly: boolean,
    withoutForm: boolean
  ) {
    let usernameField: AutofillField = null;
    for (let i = 0; i < pageDetails.fields.length; i++) {
      const f = pageDetails.fields[i];
      if (AutofillService.forCustomFieldsOnly(f)) {
        continue;
      }

      if (f.elementNumber >= passwordField.elementNumber) {
        break;
      }

      if (
        !f.disabled &&
        (canBeReadOnly || !f.readonly) &&
        (withoutForm || f.form === passwordField.form) &&
        (canBeHidden || f.viewable) &&
        (f.type === "text" || f.type === "email" || f.type === "tel")
      ) {
        usernameField = f;

        if (this.findMatchingFieldIndex(f, AutoFillConstants.UsernameFieldNames) > -1) {
          // We found an exact match. No need to keep looking.
          break;
        }
      }
    }

    return usernameField;
  }

  // For a given field on the page, find the matching index in the array of cipher field names
  private findMatchingFieldIndex(field: AutofillField, targetFieldNames: string[]): number {
    for (let i = 0; i < targetFieldNames.length; i++) {
      if (targetFieldNames[i].indexOf("=") > -1) {
        if (this.fieldPropertyIsPrefixMatch(field, "htmlID", targetFieldNames[i], "id")) {
          return i;
        }
        if (this.fieldPropertyIsPrefixMatch(field, "htmlName", targetFieldNames[i], "name")) {
          return i;
        }
        if (this.fieldPropertyIsPrefixMatch(field, "label-tag", targetFieldNames[i], "label")) {
          return i;
        }
        if (this.fieldPropertyIsPrefixMatch(field, "label-aria", targetFieldNames[i], "label")) {
          return i;
        }
        if (
          this.fieldPropertyIsPrefixMatch(field, "placeholder", targetFieldNames[i], "placeholder")
        ) {
          return i;
        }
      }

      if (this.fieldPropertyIsMatch(field, "htmlID", targetFieldNames[i])) {
        return i;
      }
      if (this.fieldPropertyIsMatch(field, "htmlName", targetFieldNames[i])) {
        return i;
      }
      if (this.fieldPropertyIsMatch(field, "label-tag", targetFieldNames[i])) {
        return i;
      }
      if (this.fieldPropertyIsMatch(field, "label-aria", targetFieldNames[i])) {
        return i;
      }
      if (this.fieldPropertyIsMatch(field, "placeholder", targetFieldNames[i])) {
        return i;
      }
    }

    return -1;
  }

  private fieldPropertyIsPrefixMatch(
    field: any,
    property: string,
    name: string,
    prefix: string,
    separator = "="
  ): boolean {
    if (name.indexOf(prefix + separator) === 0) {
      const sepIndex = name.indexOf(separator);
      const val = name.substring(sepIndex + 1);
      return val != null && this.fieldPropertyIsMatch(field, property, val);
    }
    return false;
  }

  private fieldPropertyIsMatch(field: any, property: string, name: string): boolean {
    let fieldVal = field[property] as string;
    if (!AutofillService.hasValue(fieldVal)) {
      return false;
    }

    fieldVal = fieldVal.trim().replace(/(?:\r\n|\r|\n)/g, "");
    if (name.startsWith("regex=")) {
      try {
        const regexParts = name.split("=", 2);
        if (regexParts.length === 2) {
          const regex = new RegExp(regexParts[1], "i");
          return regex.test(fieldVal);
        }
      } catch (e) {
        this.logService.error(e);
      }
    } else if (name.startsWith("csv=")) {
      const csvParts = name.split("=", 2);
      if (csvParts.length === 2) {
        const csvVals = csvParts[1].split(",");
        for (let i = 0; i < csvVals.length; i++) {
          const val = csvVals[i];
          if (val != null && val.trim().toLowerCase() === fieldVal.toLowerCase()) {
            return true;
          }
        }
        return false;
      }
    }

    return fieldVal.toLowerCase() === name;
  }

  static fieldIsFuzzyMatch(field: AutofillField, names: string[]): boolean {
    if (AutofillService.hasValue(field.htmlID) && this.fuzzyMatch(names, field.htmlID)) {
      return true;
    }
    if (AutofillService.hasValue(field.htmlName) && this.fuzzyMatch(names, field.htmlName)) {
      return true;
    }
    if (
      AutofillService.hasValue(field["label-tag"]) &&
      this.fuzzyMatch(names, field["label-tag"])
    ) {
      return true;
    }
    if (AutofillService.hasValue(field.placeholder) && this.fuzzyMatch(names, field.placeholder)) {
      return true;
    }
    if (
      AutofillService.hasValue(field["label-left"]) &&
      this.fuzzyMatch(names, field["label-left"])
    ) {
      return true;
    }
    if (
      AutofillService.hasValue(field["label-top"]) &&
      this.fuzzyMatch(names, field["label-top"])
    ) {
      return true;
    }
    if (
      AutofillService.hasValue(field["label-aria"]) &&
      this.fuzzyMatch(names, field["label-aria"])
    ) {
      return true;
    }

    return false;
  }

  private static fuzzyMatch(options: string[], value: string): boolean {
    if (options == null || options.length === 0 || value == null || value === "") {
      return false;
    }

    value = value
      .replace(/(?:\r\n|\r|\n)/g, "")
      .trim()
      .toLowerCase();

    for (let i = 0; i < options.length; i++) {
      if (value.indexOf(options[i]) > -1) {
        return true;
      }
    }

    return false;
  }

  static hasValue(str: string): boolean {
    return str && str !== "";
  }

  static setFillScriptForFocus(
    filledFields: { [id: string]: AutofillField },
    fillScript: AutofillScript
  ): AutofillScript {
    let lastField: AutofillField = null;
    let lastPasswordField: AutofillField = null;

    for (const opid in filledFields) {
      // eslint-disable-next-line
      if (filledFields.hasOwnProperty(opid) && filledFields[opid].viewable) {
        lastField = filledFields[opid];

        if (filledFields[opid].type === "password") {
          lastPasswordField = filledFields[opid];
        }
      }
    }

    // Prioritize password field over others.
    if (lastPasswordField) {
      fillScript.script.push(["focus_by_opid", lastPasswordField.opid]);
    } else if (lastField) {
      fillScript.script.push(["focus_by_opid", lastField.opid]);
    }

    return fillScript;
  }

  static fillByOpid(fillScript: AutofillScript, field: AutofillField, value: string): void {
    if (field.maxLength && value && value.length > field.maxLength) {
      value = value.substr(0, value.length);
    }
    if (field.tagName !== "span") {
      fillScript.script.push(["click_on_opid", field.opid]);
      fillScript.script.push(["focus_by_opid", field.opid]);
    }
    fillScript.script.push(["fill_by_opid", field.opid, value]);
  }

  static forCustomFieldsOnly(field: AutofillField): boolean {
    return field.tagName === "span";
  }
}
