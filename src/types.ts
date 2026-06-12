export type Network = 'MTN' | 'Airtel' | 'Glo' | '9mobile';

export type TransactionType = 
  | 'airtime' 
  | 'data' 
  | 'electricity' 
  | 'cable' 
  | 'education' 
  | 'funding' 
  | 'withdrawal' 
  | 'referral_bonus' 
  | 'cashback'
  | 'smm'
  | 'betting';

export type TransactionStatus = 'success' | 'failed' | 'pending';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  fee: number;
  status: TransactionStatus;
  timestamp: string;
  description: string;
  recipient: string;
  reference: string;
  details?: {
    network?: Network;
    planName?: string;
    meterNumber?: string;
    disco?: string;
    token?: string; // For prepaid electricity
    iucNumber?: string;
    provider?: string;
    packageName?: string;
    examType?: string;
    pins?: Array<{ serial: string; pin: string }>; // For exam vouchers
    cardNumber?: string;
    bankName?: string;
    accountNumber?: string;
  };
}

export type KYCLevel = 'Basic' | 'Tier 1' | 'Tier 2' | 'Tier 3';

export interface SavedBeneficiary {
  id: string;
  type: 'phone' | 'meter' | 'iuc';
  name: string;
  value: string;
  provider: string; // Network for phone, Disco for meter, Cable name for iuc
  networkLogo?: string;
}

export interface UserState {
  name: string;
  email: string;
  phone: string;
  walletBalance: number;
  referralCode: string;
  referredCount: number;
  referralEarnings: number;
  kycLevel: KYCLevel;
  transactionPin: string; // 4-digit PIN
  isPinSet: boolean;
  isWebAuthnEnabled?: boolean;
  webAuthnCredentialId?: string;
  role?: 'user' | 'admin' | 'super_admin';
  monnifyAccountReference?: string | null;
  monnifyBankName?: string | null;
  monnifyAccountNumber?: string | null;
  monnifyAccountName?: string | null;
}

export interface DataPlan {
  id: string;
  name: string;
  price: number;
  validity: string;
  allowance: string;
  category: 'daily' | 'weekly' | 'monthly' | 'sme';
}

export type ActiveTab = 
  | 'dashboard' 
  | 'airtime' 
  | 'data' 
  | 'electricity' 
  | 'cable' 
  | 'education' 
  | 'wallet' 
  | 'transactions' 
  | 'settings'
  | 'smm'
  | 'admin_dashboard'
  | 'super_admin_dashboard';

export type Language = 'english' | 'pidgin';
