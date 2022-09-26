import { Folder } from "@bitwarden/common/models/domain";
import { FolderResponse } from "@bitwarden/common/models/response/folderResponse";

export class FolderApiServiceAbstraction {
  save: (folder: Folder) => Promise<any>;
  delete: (id: string) => Promise<any>;
  get: (id: string) => Promise<FolderResponse>;
}
