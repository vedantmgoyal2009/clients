import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";

import { AuthGuard } from "@bitwarden/angular/guards/auth.guard";
import { Permissions } from "@bitwarden/common/enums/permissions";

import { OrganizationVaultModule } from "../modules/vault/modules/organization-vault/organization-vault.module";

import { OrganizationBillingHistoryComponent } from "./billing/organization-billing-history.component";
import { OrganizationBillingTabComponent } from "./billing/organization-billing-tab.component";
import { OrganizationPaymentMethodComponent } from "./billing/organization-payment-method.component";
import { OrganizationSubscriptionComponent } from "./billing/organization-subscription.component";
import { GroupsComponent } from "./groups/groups.component";
import { PermissionsGuard } from "./guards/permissions.guard";
import { OrganizationLayoutComponent } from "./layouts/organization-layout.component";
import { CollectionsComponent } from "./manage/collections.component";
import { EventsComponent } from "./manage/events.component";
import { ManageComponent } from "./manage/manage.component";
import { PoliciesComponent } from "./manage/policies.component";
import { MembersComponent } from "./members/members.component";
import { ReportListComponent } from "./reporting/report-list.component";
import { ReportingComponent } from "./reporting/reporting.component";
import { NavigationPermissionsService } from "./services/navigation-permissions.service";
import { AccountComponent } from "./settings/account.component";
import { SettingsComponent } from "./settings/settings.component";
import { TwoFactorSetupComponent } from "./settings/two-factor-setup.component";
import { ExposedPasswordsReportComponent } from "./tools/exposed-passwords-report.component";
import { InactiveTwoFactorReportComponent } from "./tools/inactive-two-factor-report.component";
import { ReusedPasswordsReportComponent } from "./tools/reused-passwords-report.component";
import { ToolsComponent } from "./tools/tools.component";
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
        path: "tools",
        component: ToolsComponent,
        canActivate: [PermissionsGuard],
        data: { permissions: NavigationPermissionsService.getPermissions("tools") },
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "import",
          },
          {
            path: "",
            loadChildren: () =>
              import("./tools/import-export/org-import-export.module").then(
                (m) => m.OrganizationImportExportModule
              ),
          },
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
        path: "manage",
        component: ManageComponent,
        canActivate: [PermissionsGuard],
        data: {
          permissions: NavigationPermissionsService.getPermissions("manage"),
        },
        children: [
          {
            path: "",
            pathMatch: "full",
            redirectTo: "collections",
          },
          {
            path: "collections",
            component: CollectionsComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "collections",
              permissions: [
                Permissions.CreateNewCollections,
                Permissions.EditAnyCollection,
                Permissions.DeleteAnyCollection,
                Permissions.EditAssignedCollections,
                Permissions.DeleteAssignedCollections,
              ],
            },
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
          {
            path: "policies",
            component: PoliciesComponent,
            canActivate: [PermissionsGuard],
            data: {
              titleId: "policies",
              permissions: [Permissions.ManagePolicies],
            },
          },
        ],
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
        component: MembersComponent,
        canActivate: [PermissionsGuard],
        data: {
          titleId: "members",
          permissions: [Permissions.ManageUsers, Permissions.ManageUsersPassword],
        },
      },
      {
        path: "groups",
        component: GroupsComponent,
        canActivate: [PermissionsGuard],
        data: {
          titleId: "groups",
          permissions: [Permissions.ManageGroups],
        },
      },
      {
        path: "reporting",
        component: ReportingComponent,
        canActivate: [PermissionsGuard],
        data: {
          permissions: [Permissions.AccessReports],
        },
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
        data: {
          permissions: [Permissions.ManageBilling],
        },
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
            component: OrganizationBillingHistoryComponent,
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
