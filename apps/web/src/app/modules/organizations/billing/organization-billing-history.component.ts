import { Component, OnInit } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { PaymentMethodType } from "@bitwarden/common/enums/paymentMethodType";
import { TransactionType } from "@bitwarden/common/enums/transactionType";
import { BillingResponse } from "@bitwarden/common/models/response/billingResponse";

@Component({
  selector: "app-org-billing-history",
  templateUrl: "./organization-billing-history.component.html",
})
export class OrganizationBillingHistoryComponent implements OnInit {
  loading = false;
  firstLoaded = false;
  billing: BillingResponse;
  paymentMethodType = PaymentMethodType;
  transactionType = TransactionType;
  organizationId: string;

  constructor(private apiService: ApiService, private route: ActivatedRoute) {}

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
      this.billing = await this.apiService.getOrganizationBilling(this.organizationId);
    }
    this.loading = false;
  }

  get invoices() {
    return this.billing != null ? this.billing.invoices : null;
  }

  get transactions() {
    return this.billing != null ? this.billing.transactions : null;
  }
}
