import {
  Component,
  EventEmitter,
  Input,
  OnDestroy,
  OnInit,
  Output,
  ViewEncapsulation,
} from "@angular/core";
import { ColorPickerControl } from "@iplab/ngx-color-picker";
import { Color } from "@iplab/ngx-color-picker/public-api";
import { BehaviorSubject, debounceTime, Subject, takeUntil } from "rxjs";

import { AvatarUpdateService } from "@bitwarden/common/abstractions/account/avatar-update.service";
import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { LogService } from "@bitwarden/common/abstractions/log.service";
import { PlatformUtilsService } from "@bitwarden/common/abstractions/platformUtils.service";
import { Utils } from "@bitwarden/common/misc/utils";
import { ProfileResponse } from "@bitwarden/common/models/response/profileResponse";

@Component({
  selector: "app-change-avatar",
  templateUrl: "change-avatar.component.html",
  encapsulation: ViewEncapsulation.None,
  styles: [
    ".color-picker-parent chrome-picker { margin: auto; width: 100%; display: flex; box-shadow: none;  }",
    "chrome-picker saturation-component { display: flex; width: 50%; border-radius: 4px;  }",
    "chrome-picker .controls { width: 50%; padding-top: 0!important; padding-bottom: 0!important; display: flex; flex-direction: column; align-content: space-between; flex-flow: row wrap;  }",
    "chrome-picker .controls .column hue-component { height: 24px; border-radius: 4px; }",
    "chrome-picker .controls .column hue-component .pointer { width: 24px; height: 24px; top: 0px;  }",
    "chrome-picker .controls .hue-alpha .column:first-child { display: none; }",
  ],
})
export class ChangeAvatarComponent implements OnInit, OnDestroy {
  @Input() profile: ProfileResponse;

  @Output() changeColor: EventEmitter<string | null> = new EventEmitter();
  @Output() onSaved = new EventEmitter();

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
  customColor$ = new BehaviorSubject<string | null>(null);
  customTextColor$ = new BehaviorSubject<string>("#000000");
  customColorSelected = false;
  colorPickerControl: ColorPickerControl;
  currentSelection: string;

  private destroy$ = new Subject<void>();

  constructor(
    private i18nService: I18nService,
    private platformUtilsService: PlatformUtilsService,
    private logService: LogService,
    private accountUpdateService: AvatarUpdateService
  ) {
    this.setupCustomPicker();
  }

  async ngOnInit() {
    //localise the default colours
    this.defaultColorPalette.forEach((c) => (c.name = this.i18nService.t(c.name)));

    this.customColor$.pipe(takeUntil(this.destroy$)).subscribe((color: string | null) => {
      if (color == null) {
        return;
      }
      this.customTextColor$.next(Utils.pickTextColorBasedOnBgColor(color));
      this.customColorSelected = true;
      this.colorPickerControl.setValueFrom(color);
      this.currentSelection = color;
    });

    this.setSelection(await this.accountUpdateService.loadColorFromState());
  }

  async setupCustomPicker() {
    this.colorPickerControl = new ColorPickerControl().hidePresets().hideAlphaChannel();
    this.colorPickerControl.valueChanges
      .pipe(debounceTime(200), takeUntil(this.destroy$))
      .subscribe((color: Color) => {
        this.customColor$.next(color.toHexString().toLowerCase());
      });
  }

  async showCustomPicker() {
    this.customColorSelected = true;
    this.colorPickerControl.setValueFrom("#ffffff");
    this.setSelection(this.customColor$.value);
  }

  async generateAvatarColor() {
    Utils.stringToColor(this.profile.name.toString());
  }

  async submit() {
    try {
      if (Utils.validateHexColor(this.currentSelection) || this.currentSelection == null) {
        await this.accountUpdateService.pushUpdate(this.currentSelection);
        this.changeColor.emit(this.currentSelection);
        this.platformUtilsService.showToast("success", null, this.i18nService.t("avatarUpdated"));
      } else {
        this.platformUtilsService.showToast("error", null, this.i18nService.t("errorOccurred"));
      }
    } catch (e) {
      this.logService.error(e);
      this.platformUtilsService.showToast("error", null, this.i18nService.t("errorOccurred"));
    }
  }

  async ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private async setSelection(color: string | null) {
    this.defaultColorPalette.filter((x) => x.selected).forEach((c) => (c.selected = false));

    if (color == null) {
      return;
    }

    color = color.toLowerCase();

    this.customColorSelected = false;
    //Allow for toggle
    if (this.currentSelection === color) {
      this.currentSelection = null;
    } else {
      const selectedColorIndex = this.defaultColorPalette.findIndex((c) => c.color === color);
      if (selectedColorIndex !== -1) {
        this.defaultColorPalette[selectedColorIndex].selected = true;
        this.currentSelection = color;
      } else {
        this.customColor$.next(color);
      }
    }
  }
}

export class NamedAvatarColor {
  name: string;
  color: string;
  selected? = false;
}
