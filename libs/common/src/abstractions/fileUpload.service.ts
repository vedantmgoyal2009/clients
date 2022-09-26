import { EncArrayBuffer, EncString } from "../models/domain";
import { AttachmentUploadDataResponse } from "../models/response/attachmentUploadDataResponse";
import { SendFileUploadDataResponse } from "../models/response/sendFileUploadDataResponse";

export abstract class FileUploadService {
  uploadSendFile: (
    uploadData: SendFileUploadDataResponse,
    fileName: EncString,
    encryptedFileData: EncArrayBuffer
  ) => Promise<any>;
  uploadCipherAttachment: (
    admin: boolean,
    uploadData: AttachmentUploadDataResponse,
    fileName: EncString,
    encryptedFileData: EncArrayBuffer
  ) => Promise<any>;
}
