import { Component, OnInit } from "@angular/core";
import { ActivatedRoute, Router } from "@angular/router";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { PaymentMethodType } from "@bitwarden/common/enums/paymentMethodType";
import { TransactionType } from "@bitwarden/common/enums/transactionType";
import { BillingHistoryResponse } from "@bitwarden/common/models/response/billingHistoryResponse";

@Component({
  selector: "app-user-billing",
  templateUrl: "user-billing-history.component.html",
})
export class UserBillingHistoryComponent implements OnInit {
  loading = false;
  firstLoaded = false;
  billing: BillingHistoryResponse;
  paymentMethodType = PaymentMethodType;
  transactionType = TransactionType;
  organizationId?: string;

  constructor(
    protected apiService: ApiService,
    protected i18nService: I18nService,
    protected platformUtilsService: PlatformUtilsService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  async ngOnInit() {
    this.route.params.subscribe(async (params) => {
      if (params.organizationId) {
        this.organizationId = params.organizationId;
      } else if (this.platformUtilsService.isSelfHost()) {
        this.router.navigate(["/settings/subscription"]);
        return;
      }
      await this.load();
      this.firstLoaded = true;
    });
  }

  async load() {
    if (this.loading) {
      return;
    }
    this.loading = true;

    if (this.forOrganization) {
      this.billing = await this.apiService.getOrganizationBilling(this.organizationId);
    } else {
      this.billing = await this.apiService.getUserBillingHistory();
    }

    this.loading = false;
  }

  get invoices() {
    return this.billing != null ? this.billing.invoices : null;
  }

  get transactions() {
    return this.billing != null ? this.billing.transactions : null;
  }

  get forOrganization() {
    return this.organizationId != null;
  }

  get headerClass() {
    return this.forOrganization ? ["page-header"] : ["tabbed-header"];
  }

  paymentMethodClasses(type: PaymentMethodType) {
    switch (type) {
      case PaymentMethodType.Card:
        return ["bwi-credit-card"];
      case PaymentMethodType.BankAccount:
      case PaymentMethodType.WireTransfer:
        return ["bwi-bank"];
      case PaymentMethodType.BitPay:
        return ["bwi-bitcoin text-warning"];
      case PaymentMethodType.PayPal:
        return ["bwi-paypal text-primary"];
      default:
        return [];
    }
  }
}
