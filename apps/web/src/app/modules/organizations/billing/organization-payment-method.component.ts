import { Component, OnInit, ViewChild } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PaymentMethodType } from "@bitwarden/common/enums/paymentMethodType";
import { VerifyBankRequest } from "@bitwarden/common/models/request/verifyBankRequest";
import { BillingResponse } from "@bitwarden/common/models/response/billingResponse";
import { OrganizationResponse } from "@bitwarden/common/models/response/organizationResponse";

import { TaxInfoComponent } from "src/app/settings/tax-info.component";

@Component({
  selector: "app-org-payment-method",
  templateUrl: "./organization-payment-method.component.html",
})
export class OrganizationPaymentMethodComponent implements OnInit {
  @ViewChild(TaxInfoComponent) taxInfo: TaxInfoComponent;

  loading = false;
  firstLoaded = false;
  showAdjustPayment = false;
  showAddCredit = false;
  billing: BillingResponse;
  org: OrganizationResponse;
  paymentMethodType = PaymentMethodType;
  organizationId: string;
  verifyAmount1: number;
  verifyAmount2: number;

  verifyBankPromise: Promise<any>;
  taxFormPromise: Promise<any>;

  constructor(
    private apiService: ApiService,
    private i18nService: I18nService,
    private route: ActivatedRoute,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService
  ) {}

  async ngOnInit() {
    this.route.parent.parent.params.subscribe(async (params) => {
      this.organizationId = params.organizationId;
      await this.load();
      this.firstLoaded = true;
    });
  }

  async load() {
    if (this.loading) {
      return;
    }
    this.loading = true;
    if (this.organizationId != null) {
      const billingPromise = this.apiService.getOrganizationBilling(this.organizationId);
      const orgPromise = this.apiService.getOrganization(this.organizationId);

      const results = await Promise.all([billingPromise, orgPromise]);

      this.billing = results[0];
      this.org = results[1];
    }
    this.loading = false;
  }

  async verifyBank() {
    if (this.loading) {
      return;
    }

    try {
      const request = new VerifyBankRequest();
      request.amount1 = this.verifyAmount1;
      request.amount2 = this.verifyAmount2;
      this.verifyBankPromise = this.apiService.postOrganizationVerifyBank(
        this.organizationId,
        request
      );
      await this.verifyBankPromise;
      this.platformUtilsService.showToast(
        "success",
        null,
        this.i18nService.t("verifiedBankAccount")
      );
      this.load();
    } catch (e) {
      this.logService.error(e);
    }
  }

  async submitTaxInfo() {
    this.taxFormPromise = this.taxInfo.submitTaxInfo();
    await this.taxFormPromise;
    this.platformUtilsService.showToast("success", null, this.i18nService.t("taxInfoUpdated"));
  }

  addCredit() {
    if (this.paymentSourceInApp) {
      this.platformUtilsService.showDialog(
        this.i18nService.t("cannotPerformInAppPurchase"),
        this.i18nService.t("addCredit"),
        null,
        null,
        "warning"
      );
      return;
    }
    this.showAddCredit = true;
  }

  closeAddCredit(load: boolean) {
    this.showAddCredit = false;
    if (load) {
      this.load();
    }
  }

  changePayment() {
    if (this.paymentSourceInApp) {
      this.platformUtilsService.showDialog(
        this.i18nService.t("cannotPerformInAppPurchase"),
        this.i18nService.t("changePaymentMethod"),
        null,
        null,
        "warning"
      );
      return;
    }
    this.showAdjustPayment = true;
  }

  closePayment(load: boolean) {
    this.showAdjustPayment = false;
    if (load) {
      this.load();
    }
  }

  get isCreditBalance() {
    return this.billing == null || this.billing.balance <= 0;
  }

  get creditOrBalance() {
    return Math.abs(this.billing != null ? this.billing.balance : 0);
  }

  get paymentSource() {
    return this.billing != null ? this.billing.paymentSource : null;
  }

  get paymentSourceInApp() {
    return (
      this.paymentSource != null &&
      (this.paymentSource.type === PaymentMethodType.AppleInApp ||
        this.paymentSource.type === PaymentMethodType.GoogleInApp)
    );
  }
}
