import { PaymentMethodType } from "../../enums/paymentMethodType";
import { OrganizationTaxInfoUpdateRequest } from "../request/organization-tax-info-update.request";

export class PaymentRequest extends OrganizationTaxInfoUpdateRequest {
  paymentMethodType: PaymentMethodType;
  paymentToken: string;
}
