import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from "@angular/core";
import { BehaviorSubject, debounceTime, Subject, takeUntil } from "rxjs";

import { ApiService } from "@bitwarden/common/abstractions/api.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { UpdateProfileRequest } from "@bitwarden/common/models/request/updateProfileRequest";
import { ProfileResponse } from "@bitwarden/common/models/response/profileResponse";
@Component({
  selector: "app-change-avatar",
  templateUrl: "change-avatar.component.html",
})
export class ChangeAvatarComponent implements OnInit, OnDestroy {
  @Input() profile: ProfileResponse;
  loading = false;
  error: string;
  defaultColorPalette: NamedAvatarColor[] = [
    { name: "brightBlue", color: "#16cbfc" },
    { name: "green", color: "#94cc4b" },
    { name: "orange", color: "#ffb520" },
    { name: "lavender", color: "#e5beed" },
    { name: "yellow", color: "#fcff41" },
    { name: "indigo", color: "#acbdf7" },
    { name: "teal", color: "#8ecdc5" },
    { name: "salmon", color: "#ffa3a3" },
    { name: "pink", color: "#ffa2d4" },
  ];

  constructor(
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private apiService: ApiService
  ) {}

  @Output() onSaved = new EventEmitter();
  customColor$ = new BehaviorSubject<string>("#fefefe");
  customTextColor$ = new BehaviorSubject<string>("#000000");
  customColorSelected = false;
  formPromise: Promise<any>;
  private destroy$ = new Subject<void>();
  currentSelection: string;

  async ngOnInit() {
    this.defaultColorPalette.forEach((c) => (c.name = this.i18nService.t(c.name)));

    const initalValue = Utils.validateHexColor(this.profile.avatarColor)
      ? this.profile.avatarColor
      : "#ffffff";
    this.setSelection(initalValue);

    this.customColor$.pipe(debounceTime(200), takeUntil(this.destroy$)).subscribe((color) => {
      this.customTextColor$.next(Utils.pickTextColorBasedOnBgColor(color));
      this.customColorSelected = true;
      this.currentSelection = color;
    });
  }

  async showCustomPicker() {
    this.setSelection(this.customColor$.value);
  }

  async submit() {
    try {
      const request = new UpdateProfileRequest(this.profile.name, this.profile.masterPasswordHint);
      request.avatarColor = this.currentSelection;
      this.formPromise = this.apiService.putProfile(request);
      await this.formPromise;
      this.platformUtilsService.showToast("success", null, this.i18nService.t("accountUpdated"));
    } catch (e) {
      this.logService.error(e);
    }
  }

  async setCustomColor(color: string) {
    this.customColor$.next(color);
  }

  async ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async setSelection(color: string) {
    color = color.toLowerCase();
    this.defaultColorPalette.filter((x) => x.selected).forEach((c) => (c.selected = false));
    const selectedColorIndex = this.defaultColorPalette.findIndex((c) => c.color === color);
    if (selectedColorIndex !== -1) {
      this.defaultColorPalette[selectedColorIndex].selected = true;
      this.customColorSelected = false;
      this.currentSelection = color;
    } else {
      this.setCustomColor(color);
    }
  }
}

export class NamedAvatarColor {
  name: string;
  color: string;
  selected? = false;
}
