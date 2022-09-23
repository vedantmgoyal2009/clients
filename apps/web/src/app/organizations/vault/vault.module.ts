import { NgModule } from "@angular/core";
import { OrganizationBadgeModule } from "src/app/vault/organization-badge/organization-badge.module";

import { VaultSharedModule } from "../../vault/shared/vault-shared.module";

import { CiphersComponent } from "./ciphers.component";
import { VaultFilterModule } from "./vault-filter/vault-filter.module";
import { VaultRoutingModule } from "./vault-routing.module";
import { VaultComponent } from "./vault.component";

@NgModule({
  imports: [VaultSharedModule, VaultRoutingModule, VaultFilterModule, OrganizationBadgeModule],
  declarations: [VaultComponent, CiphersComponent],
  exports: [VaultComponent],
})
export class VaultModule {}
