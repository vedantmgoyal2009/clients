import { Subject } from "rxjs";

export class AccountUpdateService {
  update = new Subject<boolean>();

  pushUpdate() {
    this.update.next(true);
  }
}
