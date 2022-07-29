import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "@bitwarden/angular/guards/auth.guard";
import { Permissions } from "@bitwarden/common/enums/permissions";

import { OrganizationBillingTabComponent } from "../modules/organizations/billing/organization-billing-tab.component";
import { OrganizationSubscriptionComponent } from "../modules/organizations/billing/organization-subscription.component";
import { OrganizationVaultModule } from "../modules/vault/modules/organization-vault/organization-vault.module";
import { BillingHistoryComponent } from "../settings/billing-history.component";
import { PaymentMethodComponent } from "../settings/payment-method.component";

import { PermissionsGuard } from "./guards/permissions.guard";
import { OrganizationLayoutComponent } from "./layouts/organization-layout.component";
import { GroupsComponent } from "./manage/groups.component";
import { PeopleComponent } from "./manage/people.component";
import { NavigationPermissionsService } from "./services/navigation-permissions.service";
import { AccountComponent } from "./settings/account.component";
import { SettingsComponent } from "./settings/settings.component";
import { TwoFactorSetupComponent } from "./settings/two-factor-setup.component";

const routes: Routes = [
  {
    path: ":organizationId",
    component: OrganizationLayoutComponent,
    canActivate: [AuthGuard, PermissionsGuard],
    data: {
      permissions: NavigationPermissionsService.getPermissions("admin"),
    },
    children: [
      { path: "", pathMatch: "full", redirectTo: "vault" },
      {
        path: "vault",
        loadChildren: () => OrganizationVaultModule,
      },
      {
        path: "settings",
        component: SettingsComponent,
        canActivate: [PermissionsGuard],
        data: { permissions: NavigationPermissionsService.getPermissions("settings") },
        children: [
          { path: "", pathMatch: "full", redirectTo: "account" },
          { path: "account", component: AccountComponent, data: { titleId: "organizationInfo" } },
          {
            path: "two-factor",
            component: TwoFactorSetupComponent,
            data: { titleId: "twoStepLogin" },
          },
        ],
      },
      {
        path: "members",
        component: PeopleComponent,
        canActivate: [PermissionsGuard],
        data: {
          titleId: "members",
          permissions: NavigationPermissionsService.getPermissions("members"),
        },
      },
      {
        path: "groups",
        component: GroupsComponent,
        canActivate: [PermissionsGuard],
        data: {
          titleId: "groups",
          permissions: NavigationPermissionsService.getPermissions("groups"),
        },
      },
      {
        path: "reporting",
        loadChildren: () =>
          import("../modules/organizations/reporting/organization-reporting.module").then(
            (m) => m.OrganizationReportingModule
          ),
      },
      {
        path: "billing",
        component: OrganizationBillingTabComponent,
        canActivate: [PermissionsGuard],
        data: { permissions: NavigationPermissionsService.getPermissions("billing") },
        children: [
          { path: "", pathMatch: "full", redirectTo: "subscription" },
          {
            path: "subscription",
            component: OrganizationSubscriptionComponent,
            data: { titleId: "subscription" },
          },
          {
            path: "payment-method",
            component: PaymentMethodComponent,
            canActivate: [PermissionsGuard],
            data: { titleId: "paymentMethod", permissions: [Permissions.ManageBilling] },
          },
          {
            path: "history",
            component: BillingHistoryComponent,
            canActivate: [PermissionsGuard],
            data: { titleId: "billingHistory", permissions: [Permissions.ManageBilling] },
          },
        ],
      },
    ],
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class OrganizationsRoutingModule {}
