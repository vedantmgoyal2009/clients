import { Directive, HostBinding, Input } from "@angular/core";

type TypographyTypes = "h1" | "h2" | "h3" | "h4" | "h5" | "h6" | "body1" | "body2" | "helper";

const styles: Record<TypographyTypes, string[]> = {
  h1: ["tw-text-3xl", "tw-font-semibold"],
  h2: ["tw-text-2xl", "tw-font-semibold"],
  h3: ["tw-text-xl", "tw-font-semibold"],
  h4: ["tw-text-lg", "tw-font-semibold"],
  h5: ["tw-text-base", "tw-font-semibold"],
  h6: ["tw-text-sm", "tw-font-semibold"],
  body1: ["tw-text-base"],
  body2: ["tw-text-sm"],
  helper: ["tw-text-xs"],
};

@Directive({
  selector: "[bitTypography]",
})
export class TypographyDirective {
  @Input("bitTypography") bitTypography: TypographyTypes;

  @HostBinding("class") get classList() {
    return styles[this.bitTypography] ?? ["hi"];
  }
}
