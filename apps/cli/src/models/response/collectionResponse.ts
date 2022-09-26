import { CollectionWithIdExport } from "@bitwarden/common/models/export";
import { CollectionView } from "@bitwarden/common/models/view";
import { BaseResponse } from "@bitwarden/node/cli/models/response/baseResponse";

export class CollectionResponse extends CollectionWithIdExport implements BaseResponse {
  object: string;

  constructor(o: CollectionView) {
    super();
    this.object = "collection";
    this.build(o);
  }
}
