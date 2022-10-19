import { AfterViewInit, Directive, Host, HostListener, Input } from "@angular/core";

import { ButtonComponent } from "../button";

@Directive({
  selector: "[bitToggle]",
  exportAs: "bitToggle",
})
export class BitToggleDirective implements AfterViewInit {
  @Input("bitToggle") input: HTMLInputElement;

  toggled = false;

  constructor(@Host() private button: ButtonComponent) {}

  ngAfterViewInit(): void {
    this.updateIcon();
  }

  @HostListener("click") onClick() {
    this.toggled = !this.toggled;
    this.updateIcon();
    this.input.focus();
  }

  protected updateIcon() {
    this.button.icon = this.toggled ? "bwi-eye-slash" : "bwi-eye";
    this.input.type = this.toggled ? "text" : "password";
  }
}
