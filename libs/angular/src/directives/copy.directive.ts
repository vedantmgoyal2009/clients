import { Directive, Input } from "@angular/core";

import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";

@Directive({
  selector: "[appCopyToClipboard]",
  host: {
    "(click)": "copy()",
  },
})
export class CopyDirective {
  @Input("appCopyToClipboard") text = "";

  constructor(private platformUtilsService: PlatformUtilsService) {}

  copy(): void {
    this.platformUtilsService.copyToClipboard(this.text);
  }
}
