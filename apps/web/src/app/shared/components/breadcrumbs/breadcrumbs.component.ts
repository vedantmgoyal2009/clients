import { Component, ContentChildren, QueryList } from "@angular/core";

import { BreadcrumbComponent } from "./breadcrumb.component";

@Component({
  selector: "bit-breadcrumbs",
  templateUrl: "./breadcrumbs.component.html",
})
export class BreadcrumbsComponent {
  @ContentChildren(BreadcrumbComponent)
  protected breadcrumbs: QueryList<BreadcrumbComponent>;
}
