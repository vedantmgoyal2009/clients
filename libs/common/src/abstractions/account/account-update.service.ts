import { Subject } from "rxjs";

export abstract class AccountUpdateService {
  update = new Subject<boolean>();
  abstract pushUpdate(): void;
}
