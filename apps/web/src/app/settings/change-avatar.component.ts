import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

import { ProfileResponse } from "@bitwarden/common/models/response/profileResponse";

@Component({
  selector: "app-change-avatar",
  templateUrl: "change-avatar.component.html",
})
export class ChangeAvatarComponent implements OnInit {
  @Input() profile: ProfileResponse;
  loading = false;
  error: string;
  defaultColorPalette: NamedAvatarColor[] = [
    { name: "brightBlue", color: "#16cbfc" },
    { name: "green", color: "#94cc4b" },
    { name: "orange", color: "#ffb520" },
    { name: "lavendar", color: "#e5beed" },
    { name: "yellow", color: "#fcff41" },
    { name: "indigo", color: "#acbdf7" },
    { name: "teal", color: "#8ecdc5" },
    { name: "salmon", color: "#ffa3a3" },
    { name: "pink", color: "#ffa2d4" },
    { name: "black", color: "#ffffff" },
    { name: "white", color: "#000000" },
  ];
  customColor: string;

  @Output() onSaved = new EventEmitter();

  async selectionChanged(color: string) {
    this.setSelection(color);
  }

  async ngOnInit() {
    this.setSelection(this.profile.avatarColor);
  }

  private async setSelection(color: string) {
    color = color.toLowerCase();
    this.defaultColorPalette.forEach((c) => (c.selected = false));
    const selectedColorIndex = this.defaultColorPalette.findIndex((c) => c.color === color);
    if (selectedColorIndex !== -1) {
      this.defaultColorPalette[selectedColorIndex].selected = true;
    } else {
      this.customColor = color;
    }
  }

  async submit() {
    //something
  }
}

export class NamedAvatarColor {
  name: string;
  color: string;
  selected? = false;
}
