import { Injectable } from "@angular/core";
import { BehaviorSubject } from "rxjs";

export type SearchBarState = {
  enabled: boolean;
  placeholderText: string;
};

@Injectable()
export class SearchBarService {
  searchText = new BehaviorSubject<string>(null);

  private _state = {
    enabled: false,
    placeholderText: "",
  };

  // tslint:disable-next-line:member-ordering
  state = new BehaviorSubject<SearchBarState>(this._state);

  setEnabled(enabled: boolean) {
    this._state.enabled = enabled;
    this.updateState();
  }

  setPlaceholderText(placeholderText: string) {
    this._state.placeholderText = placeholderText;
    this.updateState();
  }

  // Remove accents/diacritics characters from text. This regex is equivalent to the Diacritic unicode property escape, i.e. it will match all diacritic characters.
  setSearchText(value: string) {
    this.searchText.next(value?.normalize("NFD").replace(/[\u0300-\u036f]/g, ""));
  }

  private updateState() {
    this.state.next(this._state);
  }
}
