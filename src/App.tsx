import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  LayoutDashboard, Phone, Database, Lightbulb, Tv, GraduationCap, 
  Wallet, History, Settings, LogOut, ArrowRight, ShieldCheck, Mail, Lock, 
  Check, Sparkles, Building2, User, KeyRound, Languages, ArrowDownLeft, ArrowUpRight
} from 'lucide-react';
import { 
  ActiveTab, UserState, Transaction, SavedBeneficiary, Language 
} from './types';
import { TELCOS, PIDGIN_DICT, ENGLISH_DICT } from './data';
import { AlertToast, ToastMessage } from './components/AlertToast';
import { TransactionPinModal } from './components/TransactionPinModal';
import { ReceiptModal } from './components/ReceiptModal';
import { MainDashboard } from './components/MainDashboard';
import { AirtimeAndDataPanel } from './components/AirtimeAndDataPanel';
import { BillsRechargePanel } from './components/BillsRechargePanel';
import { EducationPinsPanel } from './components/EducationPinsPanel';
import { WalletAndBankPanel } from './components/WalletAndBankPanel';
import { TransactionsList } from './components/TransactionsList';
import { SettingsConfig } from './components/SettingsConfig';

// Mock Initial State builders
const INITIAL_BENEFICIARIES: SavedBeneficiary[] = [
  { id: 'b1', type: 'phone', name: 'Grandma Glo', value: '08051234567', provider: 'Glo' },
  { id: 'b2', type: 'phone', name: 'Study Sim (Airtel)', value: '08129876543', provider: 'Airtel' },
  { id: 'b3', type: 'meter', name: 'Apartment prepaid', value: '54120987654', provider: 'Ikeja Electric (IKEDC)' },
  { id: 'b4', type: 'iuc', name: 'Parlour DSTV', value: '10987654321', provider: 'DStv (MultiChoice)' }
];

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1',
    type: 'funding',
    amount: 15000,
    fee: 0,
    status: 'success',
    timestamp: new Date(Date.now() - 3600000 * 24).toISOString(), // 1 day ago
    description: 'Dynamic Virtual Bank Auto-Funding',
    recipient: 'Wema Bank Auto-Link',
    reference: 'TN-FUND-83910839',
  },
  {
    id: 'tx2',
    type: 'airtime',
    amount: 1000,
    fee: 0,
    status: 'success',
    timestamp: new Date(Date.now() - 3600000 * 5).toISOString(), // 5 hours ago
    description: 'MTN Airtime purchase for 08033221144',
    recipient: '08033221144',
    reference: 'TN-AIR-33041928',
    details: { network: 'MTN' }
  },
  {
    id: 'tx3',
    type: 'data',
    amount: 1200,
    fee: 0,
    status: 'success',
    timestamp: new Date(Date.now() - 3600000 * 2).toISOString(), // 2 hours ago
    description: 'Airtel Monthly Bundle 2GB',
    recipient: '08129876543',
    reference: 'TN-DAT-22091823',
    details: { network: 'Airtel', planName: 'Monthly Standard 2GB' }
  }
];

export default function App() {
  // Locale state
  const [lang, setLang] = useState<Language>('english');
  const dict = lang === 'pidgin' ? PIDGIN_DICT : ENGLISH_DICT;

  // Authentication sandbox states
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPhone, setAuthPhone] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authOtp, setAuthOtp] = useState<string>('');
  const [authMode, setAuthMode] = useState<'password' | 'otp'>('password');
  const [isRegistering, setIsRegistering] = useState<boolean>(false);
  const [regName, setRegName] = useState<string>('');

  // Primary operational state managers (persisted in dev sandbox)
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('topup_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return {
      name: 'Olawale Joseph',
      email: 'iqleadsbloger@gmail.com',
      phone: '08034567890',
      walletBalance: 24750,
      referralCode: 'TOPUP-9NGA-77',
      referredCount: 3,
      referralEarnings: 1500,
      kycLevel: 'Tier 1',
      transactionPin: '1111', // default sandboxed transaction pin
      isPinSet: true,
    };
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem('topup_txs');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_TRANSACTIONS;
  });

  const [beneficiaries, setBeneficiaries] = useState<SavedBeneficiary[]>(() => {
    const saved = localStorage.getItem('topup_bens');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) { /* fallback */ }
    }
    return INITIAL_BENEFICIARIES;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');

  // Popup & alert elements states
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [activeReceiptTx, setActiveReceiptTx] = useState<Transaction | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState<boolean>(false);

  // Security Interceptor PIN variables
  const [isPinModalOpen, setIsPinModalOpen] = useState<boolean>(false);
  const [pendingPurchaseParams, setPendingPurchaseParams] = useState<{
    type: 'airtime' | 'data' | 'electricity' | 'cable' | 'education' | 'withdrawal';
    amount: number;
    recipient: string;
    description: string;
    details: any;
  } | null>(null);

  // Sync state pools with localStorage
  useEffect(() => {
    localStorage.setItem('topup_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('topup_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('topup_bens', JSON.stringify(beneficiaries));
  }, [beneficiaries]);

  // Toast Alerts Trigger
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fast login triggers
  const executeSandboxFastLogin = () => {
    setIsAuthenticated(true);
    addToast('Logged in successfully (Sandbox account authenticated). Welcome!', 'success');
  };

  // Auth Submit Handlers
  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      if (!regName.trim() || !authEmail.trim() || !authPhone.trim() || !authPassword.trim()) {
        addToast('Please complete all registration parameters.', 'error');
        return;
      }
      setUser((prev) => ({
        ...prev,
        name: regName.trim(),
        email: authEmail.trim(),
        phone: authPhone,
        walletBalance: 2000,
        referredCount: 0,
        referralEarnings: 0,
      }));
      setIsRegistering(false);
      setIsAuthenticated(true);
      addToast('Profile account registered! ₦2,000 welcome bonus card active.', 'success');
    } else {
      // Login validation
      if (authMode === 'password') {
        if (!authEmail.trim() || !authPassword.trim()) {
          addToast('Please input email and password variables.', 'error');
          return;
        }
        setIsAuthenticated(true);
        addToast(`Signed in as ${user.name || authEmail}`, 'success');
      } else {
        if (!authPhone.trim() || !authOtp.trim()) {
          addToast('Please fill SMS OTP details.', 'error');
          return;
        }
        setIsAuthenticated(true);
        addToast(`Verified OTP for ${user.phone}. Signed in successfully!`, 'success');
      }
    }
  };

  // Handle transaction interceptions
  const handleInterceptPurchase = (params: typeof pendingPurchaseParams) => {
    setPendingPurchaseParams(params);
    setIsPinModalOpen(true);
  };

  // Execute actual ledger settlement post PIN Verification
  const executeSettledPurchase = () => {
    if (!pendingPurchaseParams) return;
    const { type, amount, recipient, description, details } = pendingPurchaseParams;

    // 1. Calculate Cashback margins (MTN/Airtel 2%, Glo/9mobile 3% cashback)
    let cashbackGained = 0;
    if (type === 'airtime' || type === 'data') {
      const net = details.network as string;
      const matchedTelco = TELCOS.find((t) => t.name === net);
      if (matchedTelco) {
        cashbackGained = (amount * matchedTelco.cashbackPercent) / 100;
      }
    }

    // Deduct main balances and add cashback
    setUser((prev) => ({
      ...prev,
      walletBalance: prev.walletBalance - amount + cashbackGained,
    }));

    // Record central transaction
    const referenceRoot = type === 'airtime' ? 'AIR' : type === 'data' ? 'DAT' : type === 'electricity' ? 'ELC' : type === 'cable' ? 'CAB' : type === 'education' ? 'EDU' : 'WTH';
    const randomTxRef = `TN-${referenceRoot}-${Math.floor(10000000 + Math.random() * 89999999)}`;
    const mainTxId = `tx_${Date.now()}`;

    const newTx: Transaction = {
      id: mainTxId,
      type,
      amount,
      fee: type === 'electricity' ? 100 : type === 'withdrawal' ? 25 : 0,
      status: 'success',
      timestamp: new Date().toISOString(),
      description,
      recipient,
      reference: randomTxRef,
      details,
    };

    setTransactions((prev) => [newTx, ...prev]);

    // Save automatic beneficiaries if opted in
    if (details.saveBeneficiary && details.beneficiaryName) {
      const bType = type === 'airtime' || type === 'data' ? 'phone' : type === 'electricity' ? 'meter' : 'iuc';
      const bProvider = type === 'airtime' || type === 'data' ? details.network : type === 'electricity' ? details.disco : details.provider;
      
      const newBen: SavedBeneficiary = {
        id: `b_${Date.now()}`,
        type: bType,
        name: details.beneficiaryName,
        value: recipient,
        provider: bProvider || 'Unknown',
      };
      setBeneficiaries((prev) => [newBen, ...prev]);
      addToast(`Added beneficiary "${details.beneficiaryName}" to favorites!`, 'success');
    }

    // Credit additional cashback transaction ledger entry if cashback exists
    if (cashbackGained > 0) {
      setTimeout(() => {
        const cashbackTx: Transaction = {
          id: `tx_cb_${Date.now()}`,
          type: 'cashback',
          amount: cashbackGained,
          fee: 0,
          status: 'success',
          timestamp: new Date().toISOString(),
          description: `+₦${cashbackGained.toFixed(2)} Instant Cashback Received (${details.network} purchase)`,
          recipient: 'Wallet Balance',
          reference: `TN-CSH-${Math.floor(100000 + Math.random() * 899999)}`,
        };
        setTransactions((prev) => [cashbackTx, ...prev]);
        addToast(`Cashback bonus of ₦${cashbackGained.toFixed(2)} credited!`, 'success');
      }, 900);
    }

    // Triggers digital reception invoice
    setIsPinModalOpen(false);
    setPendingPurchaseParams(null);
    setActiveReceiptTx(newTx);
    setIsReceiptModalOpen(true);
    addToast('Transaction executed successfully!', 'success');
  };

  const handleWalletFunding = (amount: number, description: string) => {
    setUser((prev) => ({
      ...prev,
      walletBalance: prev.walletBalance + amount,
    }));

    const newTx: Transaction = {
      id: `tx_fund_${Date.now()}`,
      type: 'funding',
      amount,
      fee: 0,
      status: 'success',
      timestamp: new Date().toISOString(),
      description,
      recipient: 'Primary wallet',
      reference: `TN-DEP-${Math.floor(10000000 + Math.random() * 89999999)}`,
    };

    setTransactions((prev) => [newTx, ...prev]);
  };

  const handleWithdrawalOutflow = (amount: number, fee: number, description: string, details: any) => {
    setUser((prev) => ({
      ...prev,
      walletBalance: prev.walletBalance - (amount + fee),
    }));

    const newTx: Transaction = {
      id: `tx_wth_${Date.now()}`,
      type: 'withdrawal',
      amount,
      fee,
      status: 'success',
      timestamp: new Date().toISOString(),
      description,
      recipient: details.accountNumber,
      reference: `TN-WTH-${Math.floor(10000000 + Math.random() * 89999999)}`,
      details,
    };

    setTransactions((prev) => [newTx, ...prev]);
    setActiveReceiptTx(newTx);
    setIsReceiptModalOpen(true);
    addToast('Transfer out settled successfully!', 'success');
  };

  const menuItems = [
    { id: 'dashboard', label: dict.dashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'airtime', label: dict.airtime, icon: <Phone className="w-4 h-4" /> },
    { id: 'data', label: dict.data, icon: <Database className="w-4 h-4" /> },
    { id: 'electricity', label: dict.electricity, icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'cable', label: dict.cable, icon: <Tv className="w-4 h-4" /> },
    { id: 'education', label: dict.education, icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'wallet', label: dict.wallet, icon: <Wallet className="w-4 h-4" /> },
    { id: 'transactions', label: dict.transactions, icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: dict.settings, icon: <Settings className="w-4 h-4" /> },
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans antialiased text-slate-800">
      
      {/* Alert Banner framework */}
      <AlertToast toasts={toasts} removeToast={removeToast} />

      {/* PIN Security Modal interceptor */}
      <TransactionPinModal
        isOpen={isPinModalOpen}
        onClose={() => {
          setIsPinModalOpen(false);
          setPendingPurchaseParams(null);
        }}
        isPinSet={user.isPinSet}
        userPin={user.transactionPin}
        amount={pendingPurchaseParams ? pendingPurchaseParams.amount : 0}
        description={pendingPurchaseParams ? pendingPurchaseParams.description : ''}
        onPinVerified={executeSettledPurchase}
        onPinSetupComplete={(newPin) => {
          setUser((prev) => ({
            ...prev,
            transactionPin: newPin,
            isPinSet: true,
          }));
          addToast('PIN setup completed. Transaction authorized!', 'success');
          // Proceed with purchase immediately with the new PIN
          setTimeout(() => executeSettledPurchase(), 100);
        }}
      />

      {/* Digital printable receipt */}
      <ReceiptModal
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setActiveReceiptTx(null);
        }}
        transaction={activeReceiptTx}
        addToast={addToast}
      />

      {!isAuthenticated ? (
        /* ================= AUTH / LOGIN CARD PORTAL ================= */
        <div className="flex-grow flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 via-white to-indigo-50/30">
          <div 
            className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden"
            style={{ animation: 'bounceUp 0.35s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Colored top bar styling */}
            <div className="bg-slate-900 px-8 py-6 text-white text-center relative overflow-hidden">
              <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-500/20 rounded-full blur-xl" />
              <div className="absolute left-0 bottom-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-lg" />
              
              <h2 className="text-3xl font-black font-display tracking-tight text-white flex items-center justify-center gap-1">
                Wavie <span className="text-amber-400 animate-pulse">⚡</span>
              </h2>
              <p className="text-xs text-indigo-200 mt-1 font-medium font-display tracking-wide uppercase">
                Nigeria&apos;s Smartest Billing Wallet
              </p>
            </div>

            {/* Auth forms */}
            <div className="p-8">
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-5">
                <div className="flex items-center justify-between border-b border-slate-50 pb-2">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                    {isRegistering ? 'Register account' : 'Access Gateway Secure'}
                  </span>
                  
                  {!isRegistering && (
                    <div className="flex gap-1.5 bg-slate-100 p-0.5 rounded-lg text-[10px] font-bold">
                      <button
                        id="auth-mode-pass"
                        type="button"
                        onClick={() => setAuthMode('password')}
                        className={`px-2 py-1 rounded transition-all ${authMode === 'password' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                      >
                        Password
                      </button>
                      <button
                        id="auth-mode-otp"
                        type="button"
                        onClick={() => setAuthMode('otp')}
                        className={`px-2 py-1 rounded transition-all ${authMode === 'otp' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-400'}`}
                      >
                        OTP Code
                      </button>
                    </div>
                  )}
                </div>

                {isRegistering && (
                  <div className="flex flex-col gap-1.5" id="reg-name-field">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Full Name</label>
                    <div className="relative">
                      <input
                        id="register-name-input"
                        type="text"
                        placeholder="e.g. Olawale Joseph"
                        value={regName}
                        onChange={(e) => setRegName(e.target.value)}
                        className="w-full p-3 pl-10 border border-slate-205 rounded-xl text-xs font-semibold focus:border-slate-800 bg-slate-50 focus:bg-white outline-none"
                        required
                      />
                      <User className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">
                    {authMode === 'otp' && !isRegistering ? 'Mobile Phone Line' : 'Email Address'}
                  </label>
                  <div className="relative">
                    {authMode === 'otp' && !isRegistering ? (
                      <input
                        id="login-phone-input"
                        type="text"
                        placeholder="0803 456 7890"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full p-3 pl-10 border border-slate-205 rounded-xl text-xs font-semibold tracking-widest font-mono bg-slate-50 focus:bg-white outline-none"
                        maxLength={11}
                        required
                      />
                    ) : (
                      <input
                        id="login-email-input"
                        type="email"
                        placeholder="customer@wavie.ng"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full p-3 pl-10 border border-slate-205 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
                        required
                      />
                    )}
                    <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                  </div>
                </div>

                {authMode === 'password' || isRegistering ? (
                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Secret Password</label>
                    <div className="relative">
                      <input
                        id="login-password-input"
                        type="password"
                        placeholder="••••••••••••"
                        value={authPassword}
                        onChange={(e) => setAuthPassword(e.target.value)}
                        className="w-full p-3 pl-10 border border-slate-205 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
                        required
                      />
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1.5 animate-fade-in" id="otp-input-field">
                    <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl border border-dotted border-slate-200">
                      <span className="text-[10px] font-bold text-indigo-700 font-display">🌟 OTP Sent to lines (Simulated)</span>
                      <button
                        id="autofill-otp-btn"
                        type="button"
                        onClick={() => {
                          setAuthOtp('7749');
                          addToast('Autofilled active testing OTP code: 7749', 'success');
                        }}
                        className="text-[9px] font-extrabold text-indigo-705 px-1.5 py-0.5 bg-indigo-50 border border-indigo-150 rounded"
                      >
                        Auto-Fill Code "7749"
                      </button>
                    </div>
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">4-Digit SMS PIN Code</label>
                    <div className="relative">
                      <input
                        id="login-otp-input"
                        type="password"
                        placeholder="••••"
                        value={authOtp}
                        onChange={(e) => setAuthOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={4}
                        className="w-full p-3 pl-10 border border-slate-205 rounded-xl text-sm font-mono tracking-widest font-black text-center bg-slate-50 focus:bg-white outline-none"
                        required
                      />
                      <Lock className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
                    </div>
                  </div>
                )}

                <button
                  id="auth-submit-btn"
                  type="submit"
                  className="w-full py-3.5 mt-2 text-white bg-slate-900 border border-slate-950 hover:bg-black rounded-xl font-bold font-display text-sm hover:shadow-md transition-all active:scale-95"
                >
                  {isRegistering ? 'Complete Registration & Login' : 'Login Sandbox Interface'}
                </button>
              </form>

              {/* Toggle registering */}
              <div className="mt-5 text-center flex flex-col gap-2.5">
                <button
                  id="toggle-register-btn"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs text-indigo-650 hover:text-indigo-850 font-bold"
                >
                  {isRegistering 
                    ? 'Already have an account? Login here' 
                    : "New to Wavie? Secure an account here"}
                </button>

                <div className="border-t border-slate-100 pt-4 mt-1.5 flex flex-col gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">🌟 Developer Demo Fast Login</span>
                  <button
                    id="fast-login-bypass-btn"
                    onClick={executeSandboxFastLogin}
                    className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold font-display rounded-xl transition-all flex items-center justify-center gap-1.5 border border-slate-150"
                  >
                    Bypass Portal with Developer Sandbox Account
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ================= AUTHENTICATED PORTAL FRAME ================= */
        <div className="flex-grow flex flex-col md:flex-row">
          
          {/* DESKTOP SIDEBAR NAVIGATION */}
          <aside className="hidden md:flex flex-col w-64 bg-white p-6 border-r border-slate-200 justify-between">
            <div className="flex flex-col gap-8">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-2 px-2">
                <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center">
                  <div className="w-4 h-4 bg-white rounded-full"></div>
                </div>
                <span className="text-xl font-bold font-display tracking-tight text-slate-900">
                  Wavie
                </span>
              </div>

              {/* Menu items */}
              <nav className="flex flex-col gap-1" id="desktop-sidebar-menu">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-semibold font-sans transition-colors text-left ${
                      activeTab === item.id
                        ? 'bg-emerald-50 text-emerald-700'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </nav>
            </div>

            {/* Logout button */}
            <button
              id="desktop-logout-btn"
              onClick={() => {
                setIsAuthenticated(false);
                addToast('Securely logged out.', 'info');
              }}
              className="flex items-center gap-3 px-3 py-2 text-slate-600 hover:bg-slate-50 hover:text-red-650 rounded-lg text-xs font-semibold font-sans transition-all text-left"
            >
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </aside>

          {/* MAIN PAGE CONTAINER */}
          <main className="flex-grow flex flex-col pb-20 md:pb-6 max-w-7xl mx-auto w-full px-4 md:px-6 py-6 overflow-x-hidden">
            
            {/* MOBILE QUICK TOP BAR */}
            <header className="md:hidden flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <span className="text-base font-black font-display text-slate-900 tracking-tight flex items-center gap-0.5 select-none">
                Wavie <span className="text-amber-500 animate-pulse text-sm">⚡</span>
              </span>

              <button
                id="mobile-quick-logout-btn"
                onClick={() => {
                  setIsAuthenticated(false);
                  addToast('Logged out.', 'info');
                }}
                className="p-1 px-3 bg-slate-100 rounded-lg text-[10px] font-bold text-slate-650 flex items-center gap-1 active:scale-95 transition-all text-red-500"
              >
                <LogOut className="w-3 h-3" />
                Logout
              </button>
            </header>

            {/* MAIN PORTLET TAB RENDERING */}
            <div className="flex-grow">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
              >
                {activeTab === 'dashboard' && (
                  <MainDashboard
                    user={user}
                    recentTransactions={transactions}
                    beneficiaries={beneficiaries}
                    onNavigate={(tab) => setActiveTab(tab)}
                    lang={lang}
                    onOpenReceipt={(tx) => {
                      setActiveReceiptTx(tx);
                      setIsReceiptModalOpen(true);
                    }}
                    addToast={addToast}
                  />
                )}

                {activeTab === 'airtime' && (
                  <AirtimeAndDataPanel
                    user={user}
                    beneficiaries={beneficiaries}
                    onTriggerPurchase={handleInterceptPurchase}
                    addToast={addToast}
                    initialType="airtime"
                  />
                )}

                {activeTab === 'data' && (
                  <AirtimeAndDataPanel
                    user={user}
                    beneficiaries={beneficiaries}
                    onTriggerPurchase={handleInterceptPurchase}
                    addToast={addToast}
                    initialType="data"
                  />
                )}

                {activeTab === 'electricity' && (
                  <BillsRechargePanel
                    user={user}
                    beneficiaries={beneficiaries}
                    onTriggerPurchase={handleInterceptPurchase}
                    addToast={addToast}
                  />
                )}

                {activeTab === 'cable' && (
                  <BillsRechargePanel
                    user={user}
                    beneficiaries={beneficiaries}
                    onTriggerPurchase={handleInterceptPurchase}
                    addToast={addToast}
                  />
                )}

                {activeTab === 'education' && (
                  <EducationPinsPanel
                    user={user}
                    onTriggerPurchase={handleInterceptPurchase}
                    addToast={addToast}
                  />
                )}

                {activeTab === 'wallet' && (
                  <WalletAndBankPanel
                    user={user}
                    onFundWallet={handleWalletFunding}
                    onWithdrawWallet={(amt, fee, desc, details) => {
                      handleInterceptPurchase({
                        type: 'withdrawal',
                        amount: amt,
                        recipient: details.accountNumber,
                        description: desc,
                        details: {
                          ...details,
                          fee
                        }
                      });
                    }}
                    addToast={addToast}
                  />
                )}

                {activeTab === 'transactions' && (
                  <TransactionsList
                    transactions={transactions}
                    onOpenReceipt={(tx) => {
                      setActiveReceiptTx(tx);
                      setIsReceiptModalOpen(true);
                    }}
                    addToast={addToast}
                  />
                )}

                {activeTab === 'settings' && (
                  <SettingsConfig
                    user={user}
                    onUpdateUser={(updated) => setUser((prev) => ({ ...prev, ...updated }))}
                    lang={lang}
                    onChangeLang={(l) => setLang(l)}
                    addToast={addToast}
                  />
                )}
              </motion.div>
            </div>

            {/* MOBILE BOTTOM NAVIGATION BAR BAR */}
            <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
              {menuItems.slice(0, 5).map((item) => (
                <button
                  key={item.id}
                  id={`mobile-nav-${item.id}`}
                  onClick={() => setActiveTab(item.id as ActiveTab)}
                  className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] transition-all focus:outline-none ${
                    activeTab === item.id
                      ? 'text-emerald-600 scale-105 font-bold'
                      : 'text-slate-400 font-medium'
                  }`}
                >
                  <div className={activeTab === item.id ? 'text-emerald-700' : 'text-slate-400'}>
                    {item.icon}
                  </div>
                  <span className="text-[9px] mt-0.5 tracking-tight font-display truncate max-w-[55px]">
                    {item.label}
                  </span>
                </button>
              ))}

              <button
                id="mobile-nav-more"
                onClick={() => {
                  const targetMore = activeTab === 'wallet' ? 'transactions' : activeTab === 'transactions' ? 'settings' : 'wallet';
                  setActiveTab(targetMore);
                  addToast(`Opening ${targetMore} tab`, 'info');
                }}
                className={`flex flex-col items-center justify-center p-1.5 min-w-[50px] transition-all focus:outline-none ${
                  ['wallet', 'transactions', 'settings'].includes(activeTab)
                    ? 'text-emerald-600 focus:scale-105'
                    : 'text-slate-400'
                }`}
              >
                <div className="p-0.5 bg-slate-105 rounded-full font-bold">
                  <Settings className="w-4 h-4 text-slate-500" />
                </div>
                <span className="text-[9px] mt-0.5 tracking-tight font-display">
                  More Config
                </span>
              </button>
            </nav>

          </main>
        </div>
      )}
    </div>
  );
}
