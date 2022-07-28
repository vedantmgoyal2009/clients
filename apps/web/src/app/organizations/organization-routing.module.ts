import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "@bitwarden/angular/guards/auth.guard";
import { Permissions } from "@bitwarden/common/enums/permissions";

import { OrganizationBillingTabComponent } from "../modules/organizations/billing/organization-billing-tab.component";
import { OrganizationPaymentMethodComponent } from "../modules/organizations/billing/organization-payment-method.component";
import { OrganizationSubscriptionComponent } from "../modules/organizations/billing/organization-subscription.component";
import { ReportListComponent } from "../modules/organizations/reporting/report-list.component";
import { ReportingComponent } from "../modules/organizations/reporting/reporting.component";
import { OrganizationVaultModule } from "../modules/vault/modules/organization-vault/organization-vault.module";

import { UserBillingHistoryComponent } from "./../settings/user-billing-history.component";
import { PermissionsGuard } from "./guards/permissions.guard";
import { OrganizationLayoutComponent } from "./layouts/organization-layout.component";
import { EventsComponent } from "./manage/events.component";
import { GroupsComponent } from "./manage/groups.component";
import { PeopleComponent } from "./manage/people.component";
import { NavigationPermissionsService } from "./services/navigation-permissions.service";
import { AccountComponent } from "./settings/account.component";
import { SettingsComponent } from "./settings/settings.component";
import { TwoFactorSetupComponent } from "./settings/two-factor-setup.component";
import { ExposedPasswordsReportComponent } from "./tools/exposed-passwords-report.component";
import { InactiveTwoFactorReportComponent } from "./tools/inactive-two-factor-report.component";
import { ReusedPasswordsReportComponent } from "./tools/reused-passwords-report.component";
import { UnsecuredWebsitesReportComponent } from "./tools/unsecured-websites-report.component";
import { WeakPasswordsReportComponent } from "./tools/weak-passwords-report.component";

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
        component: ReportingComponent,
        canActivate: [PermissionsGuard],
        data: { permissions: NavigationPermissionsService.getPermissions("reporting") },
        children: [
          { path: "", pathMatch: "full", redirectTo: "reports" },
          {
            path: "reports",
            component: ReportListComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "reports",
              permissions: [Permissions.AccessReports],
            },
            children: [
              {
                path: "exposed-passwords-report",
                component: ExposedPasswordsReportComponent,
                canActivate: [PermissionsGuard],
                data: {
                  titleId: "exposedPasswordsReport",
                  permissions: [Permissions.AccessReports],
                },
              },
              {
                path: "inactive-two-factor-report",
                component: InactiveTwoFactorReportComponent,
                canActivate: [PermissionsGuard],
                data: {
                  titleId: "inactive2faReport",
                  permissions: [Permissions.AccessReports],
                },
              },
              {
                path: "reused-passwords-report",
                component: ReusedPasswordsReportComponent,
                canActivate: [PermissionsGuard],
                data: {
                  titleId: "reusedPasswordsReport",
                  permissions: [Permissions.AccessReports],
                },
              },
              {
                path: "unsecured-websites-report",
                component: UnsecuredWebsitesReportComponent,
                canActivate: [PermissionsGuard],
                data: {
                  titleId: "unsecuredWebsitesReport",
                  permissions: [Permissions.AccessReports],
                },
              },
              {
                path: "weak-passwords-report",
                component: WeakPasswordsReportComponent,
                canActivate: [PermissionsGuard],
                data: {
                  titleId: "weakPasswordsReport",
                  permissions: [Permissions.AccessReports],
                },
              },
            ],
          },
          {
            path: "events",
            component: EventsComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "eventLogs",
              permissions: [Permissions.AccessEventLogs],
            },
          },
        ],
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
            component: OrganizationPaymentMethodComponent,
            canActivate: [PermissionsGuard],
            data: { titleId: "paymentMethod", permissions: [Permissions.ManageBilling] },
          },
          {
            path: "history",
            component: UserBillingHistoryComponent,
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
