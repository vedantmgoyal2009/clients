import { Component } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter, Subscription } from "rxjs";

import { ReportTypes } from "../../reports/report-card.component";

@Component({
  selector: "app-org-report-list",
  templateUrl: "report-list.component.html",
})
export class ReportListComponent {
  reports = [
    ReportTypes.exposedPasswords,
    ReportTypes.reusedPasswords,
    ReportTypes.weakPasswords,
    ReportTypes.unsecuredWebsites,
    ReportTypes.inactive2fa,
  ];

  homepage = true;
  subscription: Subscription;

  constructor(router: Router) {
    this.subscription = router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.homepage = (event as NavigationEnd).urlAfterRedirects.endsWith("/reports");
      });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
