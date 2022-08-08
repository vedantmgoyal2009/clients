import { NgModule } from "@angular/core";

import { ReportsSharedModule } from "../../reports";
import { SharedModule } from "../../shared/shared.module";

import { OrganizationReportingRoutingModule } from "./organization-reporting-routing.module";
import { ReportListComponent } from "./report-list.component";
import { ReportingComponent } from "./reporting.component";

@NgModule({
  imports: [SharedModule, ReportsSharedModule, OrganizationReportingRoutingModule],
  declarations: [ReportListComponent, ReportingComponent],
})
export class OrganizationReportingModule {}
