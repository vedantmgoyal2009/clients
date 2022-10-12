import { NgModule } from "@angular/core";

import { LinkModule } from "@bitwarden/components";

import { BreadcrumbComponent } from "./breadcrumb.component";
import { BreadcrumbsComponent } from "./breadcrumbs.component";

@NgModule({
  imports: [LinkModule],
  declarations: [BreadcrumbsComponent, BreadcrumbComponent],
  exports: [BreadcrumbsComponent, BreadcrumbComponent],
})
export class BreadcrumbsModule {}
