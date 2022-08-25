import { mock } from "jest-mock-extended";

import { mockFromJson } from "../../spec/utils";
import { SymmetricCryptoKey } from "../models/domain/symmetricCryptoKey";
import { CipherView } from "../models/view/cipherView";

import { DecryptCipherRequest, DecryptCipherResponse } from "./workerRequestResponse";

describe("DecryptCipherRequest", () => {
  it("initializes from a Map of orgKeys", () => {
    const orgKeys = new Map([
      ["org1", mock<SymmetricCryptoKey>()],
      ["org2", mock<SymmetricCryptoKey>()],
      ["org3", mock<SymmetricCryptoKey>()],
    ]);

    const result = new DecryptCipherRequest("requestId", null, null, null, orgKeys);

    expect(result.orgKeys["org1"]).toEqual(orgKeys.get("org1"));
    expect(result.orgKeys["org2"]).toEqual(orgKeys.get("org2"));
    expect(result.orgKeys["org3"]).toEqual(orgKeys.get("org3"));
  });

  it("initializes using fromJSON", () => {
    jest.mock("../models/domain/symmetricCryptoKey");
    jest.spyOn(SymmetricCryptoKey, "fromJSON").mockImplementation(mockFromJson);

    const obj = {
      userKey: "userKey",
      orgKeys: {
        org1: "org1Key",
        org2: "org2Key",
        org3: "org3Key",
      },
    };

    const result = DecryptCipherRequest.fromJSON(obj as any);
    expect(result.userKey).toEqual("userKey_fromJSON");
    expect(result.orgKeys["org1"]).toEqual("org1Key_fromJSON");
    expect(result.orgKeys["org2"]).toEqual("org2Key_fromJSON");
    expect(result.orgKeys["org3"]).toEqual("org3Key_fromJSON");
  });
});

describe("DecryptCipherResponse", () => {
  it("initializes using fromJSON", () => {
    jest.mock("../models/view/cipherView");
    jest.spyOn(CipherView, "fromJSON").mockImplementation(mockFromJson);

    const obj = {
      id: "responseId",
      cipherViews: ["cipher1", "cipher2", "cipher3"],
    };

    const result = DecryptCipherResponse.fromJSON(obj as any);

    expect(result.cipherViews[0]).toEqual("cipher1_fromJSON");
    expect(result.cipherViews[1]).toEqual("cipher2_fromJSON");
    expect(result.cipherViews[2]).toEqual("cipher3_fromJSON");
  });
});
