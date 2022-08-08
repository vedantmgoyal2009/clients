import { NgModule } from "@angular/core";

import { LooseComponentsModule } from "../../modules/loose-components.module";
import { SharedModule } from "../../modules/shared.module";
import { ReportsSharedModule } from "../../reports";

import { OrganizationReportingRoutingModule } from "./organization-reporting-routing.module";
import { ReportListComponent } from "./report-list.component";
import { ReportingComponent } from "./reporting.component";

@NgModule({
  imports: [
    SharedModule,
    LooseComponentsModule,
    ReportsSharedModule,
    OrganizationReportingRoutingModule,
  ],
  declarations: [ReportListComponent, ReportingComponent],
})
export class OrganizationReportingModule {}
