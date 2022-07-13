import { NgModule } from "@angular/core";

import { LooseComponentsModule } from "./modules/loose-components.module";
import { OrganizationBillingModule } from "./modules/organizations/billing/organization-billing.module";
import { OrganizationCreateModule } from "./modules/organizations/create/organization-create.module";
import { OrganizationManageModule } from "./modules/organizations/manage/organization-manage.module";
import { OrganizationReportingModule } from "./modules/organizations/reporting/organization-reporting.module";
import { OrganizationUserModule } from "./modules/organizations/users/organization-user.module";
import { PipesModule } from "./modules/pipes/pipes.module";
import { SharedModule } from "./modules/shared.module";
import { TrialInitiationModule } from "./modules/trial-initiation/trial-initiation.module";
import { VaultFilterModule } from "./modules/vault-filter/vault-filter.module";
import { OrganizationBadgeModule } from "./modules/vault/modules/organization-badge/organization-badge.module";

@NgModule({
  imports: [
    SharedModule,
    LooseComponentsModule,
    TrialInitiationModule,
    VaultFilterModule,
    OrganizationBadgeModule,
    PipesModule,
    OrganizationManageModule,
    OrganizationUserModule,
    OrganizationCreateModule,
    OrganizationBillingModule,
    OrganizationReportingModule,
  ],
  exports: [
    SharedModule,
    LooseComponentsModule,
    TrialInitiationModule,
    VaultFilterModule,
    OrganizationBadgeModule,
    PipesModule,
  ],
  bootstrap: [],
})
export class OssModule {}
