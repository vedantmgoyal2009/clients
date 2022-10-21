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

  get icon() {
    return this.toggled ? "bwi-eye-slash" : "bwi-eye";
  }

  ngAfterViewInit(): void {
    this.toggled = this.formField.input.type !== "password";
    this.button.icon = this.icon;
  }

  @HostListener("click") onClick() {
    this.toggled = !this.toggled;

    this.button.icon = this.icon;
    if (this.formField.input.type != null) {
      this.formField.input.type = this.toggled ? "text" : "password";
    }

    this.formField.input?.focus();
  }
}
