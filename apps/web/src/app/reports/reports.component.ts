import { Component, HostBinding, OnDestroy } from "@angular/core";
import { ActivatedRoute, NavigationEnd, Router } from "@angular/router";
import { Subscription } from "rxjs";
import { filter } from "rxjs/operators";

@Component({
  selector: "app-reports",
  templateUrl: "reports.component.html",
})
export class ReportsComponent implements OnDestroy {
  homepage = true;
  subscription: Subscription;
  forOrganization: boolean;

  @HostBinding("class")
  get classList() {
    return this.forOrganization ? [] : ["container", "page-content", "d-block"];
  }

  constructor(router: Router, route: ActivatedRoute) {
    route.params.subscribe((params) => {
      this.forOrganization = params.organizationId != null;
    });

    this.subscription = router.events
      .pipe(filter((event) => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.homepage = (event as NavigationEnd).urlAfterRedirects.endsWith("/reports");
      });
  }

  get containerClasses() {
    return this.forOrganization ? [] : ["container", "page-content"];
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }
}
