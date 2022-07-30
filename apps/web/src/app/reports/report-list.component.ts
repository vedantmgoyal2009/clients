import { Component } from "@angular/core";
import { ActivatedRoute } from "@angular/router";

import { ReportTypes } from "./report-card.component";

@Component({
  selector: "app-report-list",
  templateUrl: "report-list.component.html",
})
export class ReportListComponent {
  forOrganization = false;

  constructor(private route: ActivatedRoute) {
    this.route.params.subscribe((params) => {
      this.forOrganization = params.organizationId != null;
    });
  }

  get reportDescKey() {
    return this.forOrganization ? "orgsReportsDesc" : "reportsDesc";
  }

  get reportTypes() {
    return [
      ReportTypes.exposedPasswords,
      ReportTypes.reusedPasswords,
      ReportTypes.weakPasswords,
      ReportTypes.unsecuredWebsites,
      ReportTypes.inactive2fa,
    ].concat(this.forOrganization ? [] : [ReportTypes.dataBreach]);
  }
}
