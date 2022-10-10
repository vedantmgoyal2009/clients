import { Component, Input } from "@angular/core";

@Component({
  selector: "bit-breadcrumb",
  templateUrl: "./breadcrumb.component.html",
})
export class BreadcrumbComponent {
  @Input()
  icon?: string;
}
