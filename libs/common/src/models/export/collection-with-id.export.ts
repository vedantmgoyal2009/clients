import { Collection as CollectionDomain } from "../domain";
import { CollectionView } from "../view";

import { CollectionExport } from "./collection.export";

export class CollectionWithIdExport extends CollectionExport {
  id: string;

  // Use build method instead of ctor so that we can control order of JSON stringify for pretty print
  build(o: CollectionView | CollectionDomain) {
    this.id = o.id;
    super.build(o);
  }
}
