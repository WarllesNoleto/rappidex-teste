export interface User {
  id: string;
  isActive: boolean;
  ifoodMerchantId?: string;
  ifoodMerchants?: Array<{
    merchantId: string;
    name: string;
    enabled: boolean;
    pickupAddress?: string;
  }>;
  ifoodClientId?: string;
  cityId?: string;
  location: string;
  name: string;
  permission: string;
  phone: string;
  profileImage: string;
  type: string;
  user: string;
  pix?: string;
  useIfoodIntegration?: boolean;
  usesExternalIfoodPdv?: boolean;
  ifoodOrdersReleased?: number;
  ifoodOrdersUsed?: number;
  ifoodOrdersAvailable?: number;
}
