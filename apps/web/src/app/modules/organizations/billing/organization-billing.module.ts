import { NgModule } from "@angular/core";

import { LooseComponentsModule } from "../../loose-components.module";
import { SharedModule } from "../../shared.module";

import { BillingSyncApiKeyComponent } from "./billing-sync-api-key.component";
import { OrganizationBillingTabComponent } from "./organization-billing-tab.component";
import { OrganizationSubscriptionComponent } from "./organization-subscription.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule],
  declarations: [
    BillingSyncApiKeyComponent,
    OrganizationBillingTabComponent,
    OrganizationSubscriptionComponent,
  ],
  exports: [
    BillingSyncApiKeyComponent,
    OrganizationBillingTabComponent,
    OrganizationSubscriptionComponent,
  ],
})
export class OrganizationBillingModule {}
