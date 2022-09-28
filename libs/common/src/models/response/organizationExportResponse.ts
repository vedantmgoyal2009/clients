import { BaseResponse } from "./baseResponse";
import { CipherResponse } from "./cipherResponse";
import { CollectionResponse } from "./collectionResponse";
import { ListResponse } from "./listResponse";

export class OrganizationExportResponse extends BaseResponse {
  collections: ListResponse<CollectionResponse>;
  ciphers: ListResponse<CipherResponse>;

  constructor(response: any) {
    super(response);
    const collections = this.getResponseProperty("Collections");
    if (collections != null) {
      this.collections = new ListResponse(collections, CollectionResponse);
    }
    const ciphers = this.getResponseProperty("Ciphers");
    if (ciphers != null) {
      this.ciphers = new ListResponse(ciphers, CipherResponse);
    }
  }
}
