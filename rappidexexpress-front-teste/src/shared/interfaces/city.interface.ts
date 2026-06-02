export interface City {
  id?: string;
  name: string;
  createdAt?: string;
  state?: string;
  clientWhatsappMessage?: string;
  deliveryValue?: string;
  deliveryFeeValue?: number;
  pixKey?: string;
  adminWhatsapp?: string;
  whatsappPhoneNumberId?: string;
  whatsappCloudTokenMasked?: string;
  hasWhatsappCloudToken?: boolean;
}
