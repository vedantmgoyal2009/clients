import { ImportDirectoryRequestGroup } from "./import-directory-request-group.request";
import { ImportDirectoryRequestUser } from "./import-directory-request-user.request";

export class ImportDirectoryRequest {
  groups: ImportDirectoryRequestGroup[] = [];
  users: ImportDirectoryRequestUser[] = [];
  overwriteExisting = false;
  largeImport = false;
}
