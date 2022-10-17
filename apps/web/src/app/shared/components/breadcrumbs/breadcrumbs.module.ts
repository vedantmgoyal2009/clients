import { CommonModule } from "@angular/common";
import { NgModule } from "@angular/core";

import { LinkModule, MenuModule } from "@bitwarden/components";

import { BreadcrumbComponent } from "./breadcrumb.component";
import { BreadcrumbsComponent } from "./breadcrumbs.component";

@NgModule({
  imports: [CommonModule, LinkModule, MenuModule],
  declarations: [BreadcrumbsComponent, BreadcrumbComponent],
  exports: [BreadcrumbsComponent, BreadcrumbComponent],
})
export class BreadcrumbsModule {}
