import { MessageCommon } from "./messageCommon";

export type UnencryptedMessageResponse = MessageCommon &
  (
    | {
        payload: {
          status: "cancelled";
        };
      }
    | {
        payload: {
          status: "success";
          sharedKey: string;
        };
      }
    | {
        payload: {
          error: "locked" | "cannot-decrypt";
        };
      }
  );
