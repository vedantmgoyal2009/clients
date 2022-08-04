import { Component, OnDestroy, OnInit } from "@angular/core";
import { NavigationEnd, Router } from "@angular/router";
import { filter, Subscription } from "rxjs";

import { StateService } from "@bitwarden/common/abstractions/state.service";

import { ReportVariant, reports, ReportType, ReportEntry } from "../../../reports";

@Component({
  selector: "app-org-report-list",
  templateUrl: "report-list.component.html",
})
export class ReportListComponent implements OnInit, OnDestroy {
  reports: ReportEntry[];

  homepage = true;
  subscription: Subscription;

  constructor(private stateService: StateService, router: Router) {
    this.subscription = router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.homepage = (event as NavigationEnd).urlAfterRedirects.endsWith("/reports");
      });
  }

  async ngOnInit(): Promise<void> {
    const userHasPremium = await this.stateService.getCanAccessPremium();

    const reportRequiresPremium = userHasPremium
      ? ReportVariant.Enabled
      : ReportVariant.RequiresPremium;

    this.reports = [
      {
        ...reports[ReportType.ExposedPasswords],
        variant: reportRequiresPremium,
      },
      {
        ...reports[ReportType.ReusedPasswords],
        variant: reportRequiresPremium,
      },
      {
        ...reports[ReportType.WeakPasswords],
        variant: reportRequiresPremium,
      },
      {
        ...reports[ReportType.UnsecuredWebsites],
        variant: reportRequiresPremium,
      },
      {
        ...reports[ReportType.Inactive2fa],
        variant: reportRequiresPremium,
      },
    ];
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
