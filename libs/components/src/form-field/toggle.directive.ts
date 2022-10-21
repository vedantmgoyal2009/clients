import { AfterViewInit, Directive, Host, HostListener, Input } from "@angular/core";

import { ButtonComponent } from "../button";

import { BitFormFieldComponent } from "./form-field.component";

@Directive({
  selector: "[bitToggle]",
  exportAs: "bitToggle",
})
export class BitToggleDirective implements AfterViewInit {
  @Input("bitToggle") input: HTMLInputElement;

  toggled = false;

  constructor(@Host() private button: ButtonComponent, private formField: BitFormFieldComponent) {}

  ngAfterViewInit(): void {
    this.updateIcon();
  }

  @HostListener("click") onClick() {
    this.toggled = !this.toggled;
    this.updateIcon();
    this.formField.input.elementRef.nativeElement.focus();
  }

  protected updateIcon() {
    this.button.icon = this.toggled ? "bwi-eye-slash" : "bwi-eye";
    this.formField.input.elementRef.nativeElement.type = this.toggled ? "text" : "password";
  }
}
