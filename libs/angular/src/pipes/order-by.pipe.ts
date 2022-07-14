import { Pipe, PipeTransform } from "@angular/core";

import { I18nService } from "@bitwarden/common/abstractions/i18n.service";
import { Utils } from "@bitwarden/common/misc/utils";

@Pipe({
  name: "orderBy",
})
export class OrderByPipe implements PipeTransform {
  constructor(private i18nService: I18nService) {}

  transform(array: any[], sortBy: string, order = "asc"): any[] {
    if (array == null || array?.length <= 0) {
      return;
    }

    const sorted = array.sort(Utils.getSortFunction(this.i18nService, sortBy));

    return order === "asc" ? sorted : sorted.reverse();
  }
}
