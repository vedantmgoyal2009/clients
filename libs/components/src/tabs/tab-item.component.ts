import { Component, Input } from "@angular/core";

@Component({
  selector: "bit-tab-item",
  templateUrl: "./tab-item.component.html",
})
export class TabItemComponent {
  @Input() route: string; // ['/route']
  @Input() disabled = false;

  get baseClassList(): string[] {
    return [
      "tw-block",
      "tw-relative",
      "tw-py-2",
      "tw-px-4",
      "tw-leading-5",
      "tw-text-left",
      "tw-font-semibold",
      "tw-bg-transparent",
      "tw-transition",
      "tw-rounded-t",
      "tw-border-0",
      "tw-border-t-4",
      "tw-border-t-transparent",
      "tw-border-b",
      "tw-border-b-secondary-300",
      "tw-border-solid",
      "tw-cursor-pointer",
      "tw-box-border",
      "tw-text-main",
      "hover:tw-underline",
      "hover:tw-text-main",
      "focus:tw-z-10",
      "focus:tw-outline-none",
      "focus:tw-ring-2",
      "focus:tw-ring-primary-700",
      "disabled:tw-bg-secondary-100",
      "disabled:tw-text-muted",
      "disabled:tw-no-underline",
      "disabled:tw-cursor-not-allowed",
    ];
  }

  get activeClassList(): string {
    return [
      "tw-border-x",
      "tw-border-x-secondary-300",
      "tw-border-t-primary-500",
      "tw-border-b-transparent",
      "tw-bg-background",
      "tw-text-primary-500",
      "hover:tw-border-t-primary-700",
      "hover:!tw-text-primary-700",
      "focus:tw-border-t-primary-700",
      "focus:tw-text-primary-700",
    ].join(" ");
  }
}
