import { Network, DataPlan } from './types';

export interface Telco {
  name: Network;
  brandColor: string;
  borderColor: string;
  logoColor: string;
  prefixes: string[];
  cashbackPercent: number;
}

export const TELCOS: Telco[] = [
  {
    name: 'MTN',
    brandColor: 'bg-amber-400 hover:bg-amber-500 text-slate-900',
    borderColor: 'border-amber-400',
    logoColor: 'text-amber-500',
    prefixes: ['0803', '0806', '0810', '0813', '0814', '0816', '0903', '0906', '0703', '0706'],
    cashbackPercent: 2, // 2% cashback
  },
  {
    name: 'Airtel',
    brandColor: 'bg-red-600 hover:bg-red-700 text-white',
    borderColor: 'border-red-600',
    logoColor: 'text-red-500',
    prefixes: ['0802', '0808', '0812', '0701', '0708', '0901', '0902', '0907', '0912'],
    cashbackPercent: 2,
  },
  {
    name: 'Glo',
    brandColor: 'bg-green-600 hover:bg-green-700 text-white',
    borderColor: 'border-green-600',
    logoColor: 'text-green-500',
    prefixes: ['0805', '0807', '0811', '0815', '0705', '0905', '0915'],
    cashbackPercent: 3,
  },
  {
    name: '9mobile',
    brandColor: 'bg-emerald-900 hover:bg-emerald-950 text-white',
    borderColor: 'border-emerald-800',
    logoColor: 'text-emerald-700',
    prefixes: ['0809', '0817', '0818', '0908', '0909'],
    cashbackPercent: 3,
  },
];

export const DATA_PLANS: Record<Network, DataPlan[]> = {
  MTN: [
    { id: 'mtn-d1', name: '100MB Daily Extra', price: 100, validity: '24 Hours', allowance: '100MB', category: 'daily' },
    { id: 'mtn-d2', name: '1GB Daily + Youtube', price: 350, validity: '24 Hours', allowance: '1GB', category: 'daily' },
    { id: 'mtn-w1', name: '750MB Weekly', price: 500, validity: '7 Days', allowance: '750MB', category: 'weekly' },
    { id: 'mtn-w2', name: '2.5GB Weekly Blast', price: 1000, validity: '7 Days', allowance: '2.5GB', category: 'weekly' },
    { id: 'mtn-m1', name: '1.5GB Monthly Flex', price: 1200, validity: '30 Days', allowance: '1.5GB', category: 'monthly' },
    { id: 'mtn-m2', name: '10GB Monthly Heavy', price: 3000, validity: '30 Days', allowance: '10GB', category: 'monthly' },
    { id: 'mtn-sme1', name: '1GB SME Plan Promo', price: 235, validity: '30 Days', allowance: '1GB', category: 'sme' },
    { id: 'mtn-sme2', name: '2GB SME Plan Promo', price: 470, validity: '30 Days', allowance: '2GB', category: 'sme' },
    { id: 'mtn-sme5', name: '5GB SME Plan Promo', price: 1175, validity: '30 Days', allowance: '5GB', category: 'sme' },
  ],
  Airtel: [
    { id: 'air-d1', name: 'Daily Saver 150MB', price: 100, validity: '24 Hours', allowance: '150MB', category: 'daily' },
    { id: 'air-d2', name: 'Daily Mega 2GB', price: 500, validity: '24 Hours', allowance: '2GB', category: 'daily' },
    { id: 'air-w1', name: 'Weekly Giga 1.5GB', price: 600, validity: '7 Days', allowance: '1.5GB', category: 'weekly' },
    { id: 'air-w2', name: 'Super Weekly 6GB', price: 1500, validity: '7 Days', allowance: '6GB', category: 'weekly' },
    { id: 'air-m1', name: 'Monthly Standard 2GB', price: 1200, validity: '30 Days', allowance: '2GB', category: 'monthly' },
    { id: 'air-m2', name: 'Monthly Giga 20GB', price: 5000, validity: '30 Days', allowance: '20GB', category: 'monthly' },
    { id: 'air-sme1', name: '1GB Corporate Gift', price: 240, validity: '30 Days', allowance: '1GB', category: 'sme' },
    { id: 'air-sme5', name: '5GB Corporate Gift', price: 1200, validity: '30 Days', allowance: '5GB', category: 'sme' },
  ],
  Glo: [
    { id: 'glo-d1', name: 'Glo Special 150MB', price: 100, validity: '24 Hours', allowance: '150MB', category: 'daily' },
    { id: 'glo-d2', name: 'Glo Bumper 1.25GB', price: 200, validity: '24 Hours', allowance: '1.25GB', category: 'daily' },
    { id: 'glo-w1', name: 'Super Weekly 1.8GB', price: 500, validity: '7 Days', allowance: '1.8GB', category: 'weekly' },
    { id: 'glo-w2', name: 'Weekly Giga 3.7GB', price: 1000, validity: '7 Days', allowance: '3.7GB', category: 'weekly' },
    { id: 'glo-m1', name: 'Monthly Standard 3.9GB', price: 1000, validity: '30 Days', allowance: '3.9GB', category: 'monthly' },
    { id: 'glo-m2', name: 'Monthly Mega 18GB', price: 4000, validity: '30 Days', allowance: '18GB', category: 'monthly' },
    { id: 'glo-sme1', name: '1GB CG Special', price: 245, validity: '30 Days', allowance: '1GB', category: 'sme' },
    { id: 'glo-sme5', name: '5GB CG Special', price: 1210, validity: '30 Days', allowance: '5GB', category: 'sme' },
  ],
  '9mobile': [
    { id: '9m-d1', name: 'Daily Budget 100MB', price: 100, validity: '24 Hours', allowance: '100MB', category: 'daily' },
    { id: '9m-d2', name: 'Daily Heavy 1GB', price: 300, validity: '24 Hours', allowance: '1GB', category: 'daily' },
    { id: '9m-w1', name: 'Weekly Saver 1GB', price: 500, validity: '7 Days', allowance: '1GB', category: 'weekly' },
    { id: '9m-w2', name: 'Weekly Bumper 7GB', price: 1500, validity: '7 Days', allowance: '7GB', category: 'weekly' },
    { id: '9m-m1', name: 'Monthly Light 1.5GB', price: 1000, validity: '30 Days', allowance: '1.5GB', category: 'monthly' },
    { id: '9m-m2', name: 'Monthly Heavy 15GB', price: 4000, validity: '30 Days', allowance: '15GB', category: 'monthly' },
    { id: '9m-sme1', name: '1GB Data Gift', price: 260, validity: '30 Days', allowance: '1GB', category: 'sme' },
    { id: '9m-sme5', name: '5GB Data Gift', price: 1280, validity: '30 Days', allowance: '5GB', category: 'sme' },
  ],
};

export interface Disco {
  id: string;
  name: string;
  shortName: string;
  state: string;
}

export const DISCOS: Disco[] = [
  { id: 'ikedc', name: 'Ikeja Electricity Distribution Company', shortName: 'Ikeja Electric (IKEDC)', state: 'Lagos' },
  { id: 'ekedc', name: 'Eko Electricity Distribution Company', shortName: 'Eko Electric (EKEDC)', state: 'Lagos' },
  { id: 'aedc', name: 'Abuja Electricity Distribution Company', shortName: 'Abuja Disco (AEDC)', state: 'Abuja/FCT' },
  { id: 'ibedc', name: 'Ibadan Electricity Distribution Company', shortName: 'Ibadan Disco (IBEDC)', state: 'Oyo, Ogun, Osun' },
  { id: 'kedco', name: 'Kano Electricity Distribution Company', shortName: 'Kano Disco (KEDCO)', state: 'Kano, Katsina' },
  { id: 'phed', name: 'Port Harcourt Electricity Distribution Company', shortName: 'Port Harcourt (PHED)', state: 'Rivers, Akwa Ibom' },
  { id: 'kaedco', name: 'Kaduna Electricity Distribution Company', shortName: 'Kaduna Electric (KAEDCO)', state: 'Kaduna, Sokoto' },
];

export interface CablePlan {
  id: string;
  name: string;
  price: number;
  period: string;
}

export interface CableProvider {
  id: string;
  name: string;
  plans: CablePlan[];
}

export const CABLE_PROVIDERS: CableProvider[] = [
  {
    id: 'dstv',
    name: 'DStv (MultiChoice)',
    plans: [
      { id: 'dstv-yanga', name: 'DStv Yanga Package', price: 4200, period: 'Monthly' },
      { id: 'dstv-confam', name: 'DStv Confam Package', price: 7400, period: 'Monthly' },
      { id: 'dstv-compact', name: 'DStv Compact Package', price: 12500, period: 'Monthly' },
      { id: 'dstv-compact-plus', name: 'DStv Compact Plus', price: 19800, period: 'Monthly' },
      { id: 'dstv-premium', name: 'DStv Premium Package', price: 29500, period: 'Monthly' },
    ],
  },
  {
    id: 'gotv',
    name: 'GOtv (MultiChoice)',
    plans: [
      { id: 'gotv-lite', name: 'GOtv Lite Package', price: 1100, period: 'Monthly' },
      { id: 'gotv-jinja', name: 'GOtv Jinja Package', price: 2700, period: 'Monthly' },
      { id: 'gotv-jolli', name: 'GOtv Jolli Package', price: 3950, period: 'Monthly' },
      { id: 'gotv-max', name: 'GOtv Max Package', price: 5700, period: 'Monthly' },
      { id: 'gotv-supa', name: 'GOtv Supa Package', price: 7600, period: 'Monthly' },
      { id: 'gotv-supaplus', name: 'GOtv Supa Plus Package', price: 10500, period: 'Monthly' },
    ],
  },
  {
    id: 'startimes',
    name: 'StarTimes',
    plans: [
      { id: 'st-nova', name: 'StarTimes Nova Bouquet', price: 1700, period: 'Monthly' },
      { id: 'st-smart', name: 'StarTimes Smart Bouquet', price: 4500, period: 'Monthly' },
      { id: 'st-classic', name: 'StarTimes Classic Bouquet', price: 5600, period: 'Monthly' },
      { id: 'st-super', name: 'StarTimes Super Bouquet', price: 6500, period: 'Monthly' },
    ],
  },
  {
    id: 'showmax',
    name: 'Showmax',
    plans: [
      { id: 'sh-mobile', name: 'Showmax Mobile Only', price: 1200, period: 'Monthly' },
      { id: 'sh-pro-mob', name: 'Showmax Pro Mobile', price: 2500, period: 'Monthly' },
      { id: 'sh-premium', name: 'Showmax Entertainment', price: 2900, period: 'Monthly' },
    ],
  },
];

export interface ExamPackage {
  id: string;
  name: string;
  type: string;
  price: number;
}

export const EXAM_PACKAGES: ExamPackage[] = [
  { id: 'waec', name: 'WAEC Result Checker ePIN', type: 'WAEC', price: 4200 },
  { id: 'neco', name: 'NECO Token Official Release', type: 'NECO', price: 1150 },
  { id: 'nabteb', name: 'NABTEB Serial & PIN Card', type: 'NABTEB', price: 1300 },
  { id: 'jamb', name: 'JAMB UTME Registration Pin', type: 'JAMB', price: 4700 },
];

export const MOCK_NAMES = [
  'Abubakar Ibrahim', 'Chinedu Okeke', 'Olawale Joseph', 'Blessing Nwosu', 
  'Adebayo Adebisi', 'Fatima Bello', 'Ngozi Eze', 'Ezenwa Emeka', 
  'Kelechi Onyema', 'Funke Adesina', 'Yusuf Dogara', 'Aminu Garba'
];

export const PIDGIN_DICT = {
  dashboard: 'Home Dashboard',
  airtime: 'Buy Credit',
  data: 'Buy Mb / Data',
  electricity: 'Nepa Bill',
  cable: 'TV Subscription',
  education: 'Exam PINs',
  wallet: 'My Wallet',
  transactions: 'History',
  settings: 'Settings',
  
  welcome_msg: 'Welcome back, Chief!',
  wallet_bal_label: 'Money weh dey wallet',
  fund_wallet_btn: 'Put money for inside',
  withdraw_btn: 'Send to bank',
  quick_actions_header: 'Sharp Sharp Transactions',
  saved_beneficiaries: 'My People (Favorites)',
  recent_activities_header: 'Wetin you pay for lately',
  referral_card_title: 'Share & Get Free Cash!',
  referral_card_body: 'Share your code, make your friends sign up, you and dem go get instant ₦500 bonus.',
  cashback_tag: 'Get cashback sharp sharp on every buy',
  
  enter_details: 'Enter wetin we request below:',
  instant_delivery_tag: 'We code am to drop instant-instant!',
  kyc_status: 'Your KYC Level',
  referred_label: 'People weh you bring',
  referral_earnings_label: 'Cash weh you don fit make from code',
  select_pipo: 'Select person from your saved people'
};

export const ENGLISH_DICT = {
  dashboard: 'Dashboard',
  airtime: 'Airtime',
  data: 'Data Bundles',
  electricity: 'Electricity',
  cable: 'Cable TV',
  education: 'Education PINs',
  wallet: 'Wallet & Banks',
  transactions: 'Transactions',
  settings: 'My Settings',
  
  welcome_msg: 'Welcome back, Developer!',
  wallet_bal_label: 'Main Account Balance',
  fund_wallet_btn: 'Fund Wallet',
  withdraw_btn: 'Withdraw Funds',
  quick_actions_header: 'Quick Actions',
  saved_beneficiaries: 'Saved Beneficiaries',
  recent_activities_header: 'Recent Transactions',
  referral_card_title: 'Power of Referrals',
  referral_card_body: 'Get rewarded with ₦500 credited to your wallet value for each user you refer when they complete any transaction.',
  cashback_tag: 'Earn up to 3% cash rebate instantly',
  
  enter_details: 'Confirm and enter the details below:',
  instant_delivery_tag: 'Deliveries are completed within 5 seconds.',
  kyc_status: 'KYC Verification Status',
  referred_label: 'Invited Users',
  referral_earnings_label: 'Total Referral Earnings',
  select_pipo: 'Select saved beneficiary'
};
