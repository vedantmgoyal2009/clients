import { NgModule } from "@angular/core";

import { LooseComponentsModule } from "../../loose-components.module";
import { SharedModule } from "../../shared.module";

import { OrganizationReportingRoutingModule } from "./organization-reporting-routing.module";
import { ReportingTabComponent } from "./reporting-tab.component";

@NgModule({
  imports: [SharedModule, LooseComponentsModule, OrganizationReportingRoutingModule],
  declarations: [ReportingTabComponent],
})
export class OrganizationReportingModule {}
