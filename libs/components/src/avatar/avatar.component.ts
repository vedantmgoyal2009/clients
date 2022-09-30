import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnDestroy,
  OnInit,
  Output,
} from "@angular/core";
import { DomSanitizer, SafeResourceUrl } from "@angular/platform-browser";
import { debounceTime, Subject, takeUntil } from "rxjs";

import { AccountUpdateService } from "@bitwarden/common/abstractions/account/account-update.service";
import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { StateService } from "@bitwarden/common/abstractions/state.service";
import { Utils } from "@bitwarden/common/misc/utils";

type SizeTypes = "xlarge" | "large" | "default" | "small";

const SizeClasses: Record<SizeTypes, string[]> = {
  xlarge: ["tw-h-24", "tw-w-24"],
  large: ["tw-h-16", "tw-w-16"],
  default: ["tw-h-12", "tw-w-12"],
  small: ["tw-h-7", "tw-w-7"],
};

@Component({
  selector: "bit-avatar",
  template: `<img
    *ngIf="src"
    [src]="src"
    title="{{ title || text }}"
    appStopClick
    (click)="onFire()"
    (keyup.enter)="onFire()"
    (keyup.space)="onFire()"
    [attr.tabindex]="clickable ? '0' : null"
    [ngClass]="classList"
  />`,
})
export class AvatarComponent implements OnInit, OnChanges, OnDestroy {
  @Input() border = false;
  // When a color is not provided, attempt to retrieve it from the user profile.
  @Input() color: string | null;
  @Input() id: number;
  @Input() text: string;
  @Input() icon: string;
  @Input() title: string;
  @Input() size: SizeTypes = "default";
  @Input() selected = false;
  @Input() clickable = false;

  private svgCharCount = 2;
  private svgFontSize = 20;
  private svgFontWeight = 300;
  private svgSize = 48;
  private destroy$ = new Subject<void>();
  @Output() select = new EventEmitter<string>();

  src: SafeResourceUrl;

  constructor(
    public sanitizer: DomSanitizer,
    private apiService: ApiService,
    private stateService: StateService,
    private accountUpdateService: AccountUpdateService
  ) {}

  async ngOnInit() {
    this.accountUpdateService.update
      .pipe(debounceTime(500), takeUntil(this.destroy$))
      .subscribe((u) => {
        if (u) {
          this.generate();
        }
      });
  }

  async ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  ngOnChanges() {
    this.generate();
  }

  get classList() {
    return ["tw-rounded-full"]
      .concat(SizeClasses[this.size] ?? [])
      .concat(
        this.clickable
          ? ["tw-cursor-pointer", "tw-outline", "tw-outline-solid", "tw-outline-offset-1"]
          : []
      )
      .concat(
        this.clickable && !this.selected
          ? [
              "tw-outline-0",
              "hover:tw-outline-1",
              "hover:tw-outline-primary-300",
              "focus:tw-outline-2",
              "focus:tw-outline-primary-500",
            ]
          : []
      )
      .concat(this.clickable && this.selected ? ["tw-outline-[3px]", "tw-outline-primary-500"] : [])
      .concat(this.border ? ["tw-border", "tw-border-solid", "tw-border-secondary-500"] : []);
  }

  onFire() {
    this.select.emit(this.color);
  }

  private async generate() {
    let chars: string = null;
    const upperCaseText = this.text?.toUpperCase();

    chars = this.getFirstLetters(upperCaseText, this.svgCharCount);

    if (chars == null) {
      chars = this.unicodeSafeSubstring(upperCaseText, this.svgCharCount);
    }

    // If the chars contain an emoji, only show it.
    if (chars.match(Utils.regexpEmojiPresentation)) {
      chars = chars.match(Utils.regexpEmojiPresentation)[0];
    }

    let hexColor: string;

    //Color takes priority as such: input color, state color, generated color
    if (this.color) {
      hexColor = this.color;
    } else {
      const stateColor = await this.loadColorFromState();
      if (stateColor) {
        hexColor = stateColor;
      } else {
        hexColor = Utils.stringToColor(upperCaseText);
      }
    }
    const svg: HTMLElement = this.createSvgElement(this.svgSize, hexColor);
    const charObj = this.createTextElement(chars, hexColor);
    svg.appendChild(charObj);
    const html = window.document.createElement("div").appendChild(svg).outerHTML;
    const svgHtml = window.btoa(unescape(encodeURIComponent(html)));
    this.src = this.sanitizer.bypassSecurityTrustResourceUrl(
      "data:image/svg+xml;base64," + svgHtml
    );
  }

  private async loadColorFromState(): Promise<string | null> {
    let color = await this.stateService.getAvatarColor();
    //If empty, try loading it from the api, maybe the avatar color has yet to be loaded.
    if (color === undefined) {
      await this.apiService.getProfile().then((profile) => {
        this.stateService.setAvatarColor(profile.avatarColor);
        color = profile.avatarColor;
      });
    }
    return color;
  }

  private getFirstLetters(data: string, count: number): string {
    const parts = data?.split(" ");
    if (parts?.length > 1) {
      let text = "";
      for (let i = 0; i < count; i++) {
        text += this.unicodeSafeSubstring(parts[i], 1);
      }
      return text;
    }
    return null;
  }

  private createSvgElement(size: number, color: string): HTMLElement {
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

  private createTextElement(character: string, color: string): HTMLElement {
    if (this.icon) {
      const iconTag = window.document.createElement("text");
      iconTag.setAttribute("text-anchor", "middle");
      iconTag.setAttribute("y", "50%");
      iconTag.setAttribute("x", "50%");
      iconTag.setAttribute("dy", "0.35em");
      iconTag.setAttribute("pointer-events", "auto");
      iconTag.setAttribute("fill", "#000000");
      iconTag.setAttribute("font-family", "btw-font");
      iconTag.textContent = character;
      iconTag.classList.add("bwi", this.icon);
      iconTag.style.fontWeight = this.svgFontWeight.toString();
      iconTag.style.fontSize = this.svgFontSize + "px";
      return iconTag;
    } else {
      const textTag = window.document.createElement("text");
      textTag.setAttribute("text-anchor", "middle");
      textTag.setAttribute("y", "50%");
      textTag.setAttribute("x", "50%");
      textTag.setAttribute("dy", "0.35em");
      textTag.setAttribute("pointer-events", "auto");
      textTag.setAttribute("fill", Utils.pickTextColorBasedOnBgColor(color, 135, true));
      textTag.setAttribute(
        "font-family",
        '"Open Sans","Helvetica Neue",Helvetica,Arial,' +
          'sans-serif,"Apple Color Emoji","Segoe UI Emoji","Segoe UI Symbol"'
      );
      textTag.textContent = character;
      textTag.style.fontWeight = this.svgFontWeight.toString();
      textTag.style.fontSize = this.svgFontSize + "px";
      return textTag;
    }
  }

  private unicodeSafeSubstring(str: string, count: number) {
    const characters = str?.match(/./gu);
    return characters != null ? characters.slice(0, count).join("") : "";
  }
}
