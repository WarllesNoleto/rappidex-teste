export interface User {
    id: string;
    isActive: boolean;
    ifoodMerchantId?: string;
    location: string;
    name: string;
    permission: string;
    phone: string;
    profileImage: string;
    type: string;
    user: string;
    useIfoodIntegration?: boolean;
}
