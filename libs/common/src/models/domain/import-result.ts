import { CipherView, CollectionView, FolderView } from "../view";

export class ImportResult {
  success = false;
  missingPassword = false;
  errorMessage: string;
  ciphers: CipherView[] = [];
  folders: FolderView[] = [];
  folderRelationships: [number, number][] = [];
  collections: CollectionView[] = [];
  collectionRelationships: [number, number][] = [];
}
