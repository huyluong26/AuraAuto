export type AuthMode = 'login' | 'register';

export type AccountType = 'INDIVIDUAL' | 'SHOWROOM';

export interface AuthSuccessResult {
  access_token: string;
  user: {
    id: string;
    email: string;
    display_name: string;
    role: string;
    account_type?: AccountType;
    phone_number?: string;
    showroom?: {
      id: string;
      name: string;
      phone?: string;
      address?: string;
      province_code?: string;
      is_verified?: boolean;
    };
  };
}
