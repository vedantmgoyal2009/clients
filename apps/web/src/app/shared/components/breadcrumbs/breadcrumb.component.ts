import { Component, Input, TemplateRef, ViewChild } from "@angular/core";

@Component({
  selector: "bit-breadcrumb",
  templateUrl: "./breadcrumb.component.html",
})
export class BreadcrumbComponent {
  @Input()
  icon?: string;

  @Input()
  route?: unknown = "";

  @ViewChild(TemplateRef, { static: true }) content: TemplateRef<unknown>;
}
