import { Component, EventEmitter, Input, OnChanges, OnInit, Output } from "@angular/core";
import { DomSanitizer } from "@angular/platform-browser";

import { CryptoFunctionService } from "@bitwarden/common/abstractions/cryptoFunction.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { Utils } from "@bitwarden/common/misc/utils";

@Component({
  selector: "app-avatar",
  template: `<img
    *ngIf="src"
    [src]="sanitizer.bypassSecurityTrustResourceUrl(src)"
    title="{{ title || data }}"
    appStopClick
    (click)="onClick()"
    [attr.tabindex]="clickable ? '0' : null"
    [ngClass]="{
      'rounded-circle': circle,
      'tw-cursor-pointer hover:tw-ring': clickable,
      'tw-ring tw-ring-primary-700': selected
    }"
  />`,
})
export class AvatarComponent implements OnChanges, OnInit {
  @Input() data: string;
  @Input() color: string;
  @Input() email: string;
  @Input() title: string;
  @Input() size = 45;
  @Input() charCount = 2;
  @Input() fontSize = 20;
  @Input() fontWeight = 300;
  @Input() dynamic = false;
  @Input() circle = false;
  @Input() selected = false;
  @Input() clickable = false;

  @Output() select = new EventEmitter<string>();

  src: string;
  textColor: string;

  constructor(
    public sanitizer: DomSanitizer,
    private cryptoFunctionService: CryptoFunctionService,
    private stateService: StateService
  ) {}

  ngOnInit() {
    if (!this.dynamic) {
      this.generate();
    }
  }

  ngOnChanges() {
    if (this.dynamic) {
      this.generate();
    }
  }

  onClick() {
    this.select.emit(this.color);
  }

  private async generate() {
    const enableGravatars = await this.stateService.getEnableGravitars();
    if (enableGravatars && this.email != null) {
      const hashBytes = await this.cryptoFunctionService.hash(
        this.email.toLowerCase().trim(),
        "md5"
      );
      const hash = Utils.fromBufferToHex(hashBytes).toLowerCase();
      this.src = "https://www.gravatar.com/avatar/" + hash + "?s=" + this.size + "&r=pg&d=retro";
    } else {
      let chars: string = null;
      const upperData = this.data.toUpperCase();

      if (this.charCount > 1) {
        chars = this.getFirstLetters(upperData, this.charCount);
      }
      if (chars == null) {
        chars = this.unicodeSafeSubstring(upperData, this.charCount);
      }

      //Fallback to genereate color if color is not provided
      const bgColor = this.validateHexColor(this.color)
        ? this.color
        : this.stringToColor(upperData);
      //Text color is calculated based on the background color's luminance
      this.textColor = this.getTextColor(bgColor);

      // If the chars contain an emoji, only show it.
      if (chars.match(Utils.regexpEmojiPresentation)) {
        chars = chars.match(Utils.regexpEmojiPresentation)[0];
      }
      const charObj = this.getCharText(chars);

      const svg = this.getSvg(this.size, bgColor);
      svg.appendChild(charObj);
      const html = window.document.createElement("div").appendChild(svg).outerHTML;
      const svgHtml = window.btoa(unescape(encodeURIComponent(html)));
      this.src = "data:image/svg+xml;base64," + svgHtml;
    }
  }

  private stringToColor(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = "#";
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ("00" + value.toString(16)).substr(-2);
    }
    return color;
  }

  private getFirstLetters(data: string, count: number): string {
    const parts = data.split(" ");
    if (parts.length > 1) {
      let text = "";
      for (let i = 0; i < count; i++) {
        text += this.unicodeSafeSubstring(parts[i], 1);
      }
      return text;
    }
    return null;
  }

  private getSvg(size: number, color: string): HTMLElement {
    const svgTag = window.document.createElement("svg");
    svgTag.setAttribute("xmlns", "http://www.w3.org/2000/svg");
    svgTag.setAttribute("pointer-events", "none");
    svgTag.setAttribute("width", size.toString());
    svgTag.setAttribute("height", size.toString());
    svgTag.style.backgroundColor = color;
    svgTag.style.width = size + "px";
    svgTag.style.height = size + "px";
    return svgTag;
  }

  private getCharText(character: string): HTMLElement {
    const textTag = window.document.createElement("text");
    textTag.setAttribute("text-anchor", "middle");
    textTag.setAttribute("y", "50%");
    textTag.setAttribute("x", "50%");
    textTag.setAttribute("dy", "0.35em");
    textTag.setAttribute("pointer-events", "auto");
    textTag.setAttribute("fill", this.textColor);
    textTag.setAttribute(
      "font-family",
      '"Open Sans","Helvetica Neue",Helvetica,Arial,' +
        'sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"'
    );
    textTag.textContent = character;
    textTag.style.fontWeight = this.fontWeight.toString();
    textTag.style.fontSize = this.fontSize + "px";
    return textTag;
  }

  private unicodeSafeSubstring(str: string, count: number) {
    const characters = str.match(/./gu);
    return characters != null ? characters.slice(0, count).join("") : "";
  }

  private validateHexColor(color: string): boolean {
    return /^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/.test(color);
  }

  private hexToRgb(hex: string): number[] {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result.slice(1).map((n) => parseInt(n, 16)); // [r, g, b]
  }

  private calculateLuminance(rgb: number[]): number {
    const lum: number[] = [];
    rgb.forEach((color: number) => {
      let r = rgb[color] / 255.0;
      r = r <= 0.04045 ? r / 12.92 : (r = ((r + 0.055) / 1.055) ^ 2.4);
      lum.push(r);
    });
    let i = 0;
    return 0.2126 * lum[i++] + 0.7152 * lum[i++] + 0.0722 * lum[i++];
  }

  private determineComplimentaryColor(lum: number): string {
    return lum > 0.179 ? "#000000" : "#ffffff";
  }

  private getTextColor(bgColor: string): string {
    const rgb = this.hexToRgb(bgColor);
    const lum = this.calculateLuminance(rgb);
    return this.determineComplimentaryColor(lum);
  }
}
