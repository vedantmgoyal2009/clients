import { CipherType } from "@bitwarden/common/enums/cipherType";
import { CipherView } from "@bitwarden/common/models/view";
import { CollectionView } from "@bitwarden/common/models/view";
import { FolderView } from "@bitwarden/common/models/view";

import { BrowserComponentState } from "./browserComponentState";

export class BrowserGroupingsComponentState extends BrowserComponentState {
  favoriteCiphers: CipherView[];
  noFolderCiphers: CipherView[];
  ciphers: CipherView[];
  collectionCounts: Map<string, number>;
  folderCounts: Map<string, number>;
  typeCounts: Map<CipherType, number>;
  folders: FolderView[];
  collections: CollectionView[];
  deletedCount: number;
}
