import { Folder } from "../domain";

import { FolderRequest } from "./folderRequest";

export class FolderWithIdRequest extends FolderRequest {
  id: string;

  constructor(folder: Folder) {
    super(folder);
    this.id = folder.id;
  }
}
