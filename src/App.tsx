import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, Phone, Database, Lightbulb, Tv, GraduationCap, 
  Wallet, History, Settings, LogOut, ArrowRight, ShieldCheck, Mail, Lock, 
  Check, Sparkles, Building2, User, KeyRound, Languages, ArrowDownLeft, ArrowUpRight,
  Bell, Sun, Sunrise, Moon, Plane, UserPlus
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
import { motion, AnimatePresence } from 'motion/react';
import { MiaAssistant } from './components/MiaAssistant';

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
  const [regFirstName, setRegFirstName] = useState<string>('');
  const [regLastName, setRegLastName] = useState<string>('');
  const [regPassword, setRegPassword] = useState<string>('');
  const [regPin, setRegPin] = useState<string>('1111');
  const [regReferral, setRegReferral] = useState<string>('');

  // New secure 4-digit login flow states
  const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email');
  const [loginInput, setLoginInput] = useState<string>('');
  const [loginStep, setLoginStep] = useState<'identifier' | 'pin'>('identifier');
  const [loginPin, setLoginPin] = useState<string>('');
  const [isVerifyingLogin, setIsVerifyingLogin] = useState<boolean>(false);

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
      isWebAuthnEnabled: false,
      webAuthnCredentialId: '',
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
  const [showNotifications, setShowNotifications] = useState<boolean>(false);

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

  // Sync state pools with localStorage (fallback only)
  useEffect(() => {
    localStorage.setItem('topup_user', JSON.stringify(user));
  }, [user]);

  useEffect(() => {
    localStorage.setItem('topup_txs', JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem('topup_bens', JSON.stringify(beneficiaries));
  }, [beneficiaries]);

  // Synchronize state with backend SQLite SQL Database
  useEffect(() => {
    if (isAuthenticated && user.email) {
      const syncDbAndState = async () => {
        try {
          const userEmail = encodeURIComponent(user.email);
          
          // 1. Fetch/Create User
          const userRes = await fetch(`/api/user?email=${userEmail}`);
          const userData = await userRes.json();
          if (userData.success && userData.user) {
            setUser(userData.user);
          }

          // 2. Fetch Transactions
          const txsRes = await fetch(`/api/transactions?email=${userEmail}`);
          const txsData = await txsRes.json();
          if (txsData.success && txsData.transactions) {
            setTransactions(txsData.transactions);
          }

          // 3. Fetch Beneficiaries
          const bensRes = await fetch(`/api/beneficiaries?email=${userEmail}`);
          const bensData = await bensRes.json();
          if (bensData.success && bensData.beneficiaries) {
            setBeneficiaries(bensData.beneficiaries);
          }

          addToast('Connected to persistent SQL database', 'success');
        } catch (error) {
          console.error('Backend state sync failed:', error);
          addToast('Database offline, running with offline local fallback storage.', 'warning');
        }
      };
      
      syncDbAndState();
    }
  }, [isAuthenticated, user.email]);

  // Toast Alerts Trigger
  const addToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, type, message }]);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Step 1: Identifier lookup
  const handleContinueLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginInput.trim()) {
      addToast('Please enter your email or phone line to continue.', 'warning');
      return;
    }
    
    setIsVerifyingLogin(true);
    try {
      const response = await fetch('/api/auth/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: loginInput.trim() }),
      });
      const data = await response.json();
      if (data.success) {
        if (data.exists) {
          setLoginStep('pin');
          setLoginPin('');
          addToast(`Account found! Enter your secure 4-digit PIN.`, 'success');
        } else {
          addToast('Account not found. Switch to Registration below to create a new wallet!', 'warning');
          setIsRegistering(true);
          if (loginInput.includes('@')) {
            setAuthEmail(loginInput.trim());
          } else {
            setAuthPhone(loginInput.trim());
          }
        }
      } else {
        addToast(data.error || 'Verification error.', 'error');
      }
    } catch (err) {
      console.error('Lookup failed:', err);
      // Fallback local lookup
      const isEmailMatch = loginInput.trim().toLowerCase() === user.email.toLowerCase();
      const isPhoneMatch = loginInput.trim() === user.phone;
      if (isEmailMatch || isPhoneMatch) {
        setLoginStep('pin');
        setLoginPin('');
        addToast('Verified sandbox profile! Please enter your 4-digit PIN.', 'success');
      } else {
        addToast('Account offline lookup not found. You can Register to activate a new profile!', 'warning');
        setIsRegistering(true);
        if (loginInput.includes('@')) {
          setAuthEmail(loginInput);
        } else {
          setAuthPhone(loginInput);
        }
      }
    } finally {
      setIsVerifyingLogin(false);
    }
  };

  // Step 2: Validate 4-digit login pin
  const handleVerifyPin = async (proposedPin: string) => {
    if (proposedPin.length !== 4) return;
    
    setIsVerifyingLogin(true);
    try {
      const response = await fetch('/api/auth/verify-pin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          identifier: loginInput.trim(),
          pin: proposedPin
        }),
      });
      const data = await response.json();
      if (data.success && data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        addToast(`Successfully authenticated as ${data.user.name || 'User'}!`, 'success');
        setLoginPin('');
        setLoginStep('identifier');
        setLoginInput('');
      } else {
        addToast(data.error || 'Incorrect security PIN. Access denied.', 'error');
        setLoginPin('');
      }
    } catch (err) {
      console.error('PIN verification API error:', err);
      if (proposedPin === user.transactionPin) {
        setIsAuthenticated(true);
        addToast(`Welcome back, ${user.name}! (Offline authenticated)`, 'success');
        setLoginPin('');
        setLoginStep('identifier');
        setLoginInput('');
      } else {
        addToast('Incorrect security PIN. Access denied.', 'error');
        setLoginPin('');
      }
    } finally {
      setIsVerifyingLogin(false);
    }
  };

  // Auth Submit Handlers
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      if (!regFirstName.trim() || !regLastName.trim() || !authEmail.trim() || !authPhone.trim() || !regPassword.trim() || !regPin.trim()) {
        addToast('Please complete all personal and security registration details.', 'error');
        return;
      }
      if (regPin.trim().length !== 4) {
        addToast('Transaction PIN must be exactly 4 digits.', 'error');
        return;
      }

      const compositeFullName = `${regFirstName.trim()} ${regLastName.trim()}`;

      try {
        const res = await fetch('/api/user/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: authEmail.trim(),
            name: compositeFullName,
            phone: authPhone.trim(),
            password: regPassword.trim(),
            transactionPin: regPin.trim(),
            referralCode: regReferral.trim(),
          }),
        });
        const data = await res.json();
        if (data.success && data.user) {
          setUser(data.user);
          setIsRegistering(false);
          setIsAuthenticated(true);
          addToast(`Account for ${data.user.name} created successfully! ₦100 welcome credit added.`, 'success');
          // Reset fields
          setRegFirstName('');
          setRegLastName('');
          setRegPassword('');
          setRegPin('1111');
          setRegReferral('');
        } else {
          addToast(data.error || 'Server registration failed. Try again.', 'error');
        }
      } catch (err) {
        console.error('Registration failed, acting on client simulation:', err);
        setUser((prev) => ({
          ...prev,
          name: compositeFullName,
          email: authEmail.trim(),
          phone: authPhone.trim(),
          walletBalance: 100,
          referredCount: 0,
          referralEarnings: 0,
          transactionPin: regPin.trim(),
          isPinSet: true,
        }));
        setIsRegistering(false);
        setIsAuthenticated(true);
        addToast(`Welcome ${compositeFullName}! Offline mock registration active with ₦100 credit.`, 'success');
        // Reset fields
        setRegFirstName('');
        setRegLastName('');
        setRegPassword('');
        setRegPin('1111');
        setRegReferral('');
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

    // Calculate Cashback margins (MTN/Airtel 2%, Glo/9mobile 3% cashback)
    let cashbackGained = 0;
    if (type === 'airtime' || type === 'data') {
      const net = details.network as string;
      const matchedTelco = TELCOS.find((t) => t.name === net);
      if (matchedTelco) {
        cashbackGained = (amount * matchedTelco.cashbackPercent) / 100;
      }
    }

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

    // Post transaction to real unified VTU service purchase API on backend
    fetch('/api/services/purchase', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, tx: newTx, cashbackGained })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        setUser(data.user);
        if (data.transactions) {
          setTransactions((prev) => {
            const incomingIds = data.transactions.map((t: any) => t.id);
            const filtered = prev.filter(t => !incomingIds.includes(t.id));
            return [...data.transactions, ...filtered];
          });

          // Set active receipt to primary purchased transaction which is now enriched with generated PIN details from Server APIs
          const primaryTx = data.transactions.find((t: any) => t.id === newTx.id);
          if (primaryTx) {
            setActiveReceiptTx(primaryTx);
          } else {
            setActiveReceiptTx(newTx);
          }
        }
        if (cashbackGained > 0) {
          addToast(`Instant cashback of ₦${cashbackGained.toFixed(2)} received and credited!`, 'success');
        }
      }
    })
    .catch(err => {
      console.error('Service API execution error:', err);
      // Fallback offline handler
      setUser((prev) => ({
        ...prev,
        walletBalance: prev.walletBalance - amount + cashbackGained,
      }));
      setTransactions((prev) => [newTx, ...prev]);
      setActiveReceiptTx(newTx);
    })
    .finally(() => {
      setIsPinModalOpen(false);
      setPendingPurchaseParams(null);
      setIsReceiptModalOpen(true);
      addToast('Transaction executed successfully!', 'success');
    });

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
      
      fetch('/api/beneficiaries/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, beneficiary: newBen })
      })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setBeneficiaries((prev) => [newBen, ...prev]);
          addToast(`Added beneficiary "${details.beneficiaryName}" to favorites!`, 'success');
        }
      })
      .catch(err => {
        console.error('SQL saving error:', err);
        setBeneficiaries((prev) => [newBen, ...prev]);
        addToast(`Added beneficiary "${details.beneficiaryName}" (offline fallback)`, 'success');
      });
    }
  };

  const handleWalletFunding = (amount: number, description: string, paymentMethod?: string, reference?: string) => {
    const generatedRef = reference || `TN-DEP-${Math.floor(10000000 + Math.random() * 89999999)}`;

    fetch('/api/wallet/fund', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        amount,
        paymentMethod: paymentMethod || 'bank_transfer_sim',
        reference: generatedRef,
        description
      })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        setUser(data.user);
        if (data.transactions) {
          setTransactions((prev) => {
            const incomingIds = data.transactions.map((t: any) => t.id);
            const filtered = prev.filter(t => !incomingIds.includes(t.id));
            return [...data.transactions, ...filtered];
          });
        }
        addToast(`Successfully funded wallet with ₦${amount.toLocaleString()}`, 'success');
      }
    })
    .catch(err => {
      console.error('Wallet funding api error:', err);
      // Fallback
      setUser((prev) => ({
        ...prev,
        walletBalance: prev.walletBalance + amount,
      }));
      const fallbackTx: Transaction = {
        id: `tx_fund_${Date.now()}`,
        type: 'funding',
        amount,
        fee: 0,
        status: 'success',
        timestamp: new Date().toISOString(),
        description,
        recipient: 'Primary wallet',
        reference: generatedRef,
      };
      setTransactions((prev) => [fallbackTx, ...prev]);
    });
  };

  const handleWithdrawalOutflow = (amount: number, fee: number, description: string, details: any) => {
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

    fetch('/api/transactions/create', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: user.email, tx: newTx })
    })
    .then(res => res.json())
    .then(data => {
      if (data.success && data.user) {
        setUser(data.user);
        if (data.transaction) {
          setTransactions((prev) => [data.transaction, ...prev]);
        }
        setActiveReceiptTx(newTx);
        setIsReceiptModalOpen(true);
        addToast('Transfer out settled successfully!', 'success');
      }
    })
    .catch(err => {
      console.error(err);
      setUser((prev) => ({
        ...prev,
        walletBalance: prev.walletBalance - (amount + fee),
      }));
      setTransactions((prev) => [newTx, ...prev]);
      setActiveReceiptTx(newTx);
      setIsReceiptModalOpen(true);
      addToast('Transfer out settled (offline fallback)', 'success');
    });
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
        isWebAuthnEnabled={user.isWebAuthnEnabled}
        webAuthnCredentialId={user.webAuthnCredentialId}
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

      {isAuthenticated && (
        <MiaAssistant
          user={user}
          onInterceptPurchase={handleInterceptPurchase}
          transactions={transactions}
          addToast={addToast}
        />
      )}

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
              {isRegistering ? (
                /* ============= REGISTER SCREEN ============= */
                <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4 animate-fade-in">
                  
                  {/* Title and Jet Icon Header Section */}
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-slate-900 font-display uppercase tracking-tight">
                        create your account
                      </span>
                      <Plane className="w-5 h-5 text-indigo-650 rotate-45 transform animate-bob cursor-pointer" />
                    </div>
                    <p className="text-[11px] text-slate-550 font-medium font-sans italic leading-none">
                      ( fill in your details below to get sttrte for free )
                    </p>
                  </div>

                  {/* Division Header label */}
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-[1px] bg-slate-100 flex-grow" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest font-display whitespace-nowrap">
                      personal info
                    </span>
                    <div className="h-[1px] bg-slate-100 flex-grow" />
                  </div>

                  {/* First Name & Last Name Input Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1" id="reg-firstname-field">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">First Name</label>
                      <div className="relative">
                        <input
                          id="register-firstname-input"
                          type="text"
                          placeholder="Olawale"
                          value={regFirstName}
                          onChange={(e) => setRegFirstName(e.target.value)}
                          className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl text-xs font-semibold focus:border-slate-800 bg-slate-50 focus:bg-white outline-none"
                          required
                        />
                        <User className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1" id="reg-lastname-field">
                      <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">Last Name</label>
                      <div className="relative">
                        <input
                          id="register-lastname-input"
                          type="text"
                          placeholder="Joseph"
                          value={regLastName}
                          onChange={(e) => setRegLastName(e.target.value)}
                          className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl text-xs font-semibold focus:border-slate-800 bg-slate-50 focus:bg-white outline-none"
                          required
                        />
                        <User className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
                      </div>
                    </div>
                  </div>

                  {/* Mobile Phone Input Area */}
                  <div className="flex flex-col gap-1" id="reg-phone-field">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">Phone Number</label>
                    <div className="relative">
                      <input
                        id="register-phone-input"
                        type="text"
                        placeholder="e.g. 08034567890"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl text-xs font-semibold tracking-wider font-mono bg-slate-50 focus:bg-white outline-none"
                        maxLength={11}
                        required
                      />
                      <Phone className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Email Input Field */}
                  <div className="flex flex-col gap-1" id="reg-email-field">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">Email</label>
                    <div className="relative">
                      <input
                        id="register-email-input"
                        type="email"
                        placeholder="customer@wavie.ng"
                        value={authEmail}
                        onChange={(e) => setAuthEmail(e.target.value)}
                        className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl text-xs font-semibold focus:border-slate-800 bg-slate-50 focus:bg-white outline-none"
                        required
                      />
                      <Mail className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Password Input Field */}
                  <div className="flex flex-col gap-1" id="reg-password-field">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">Password</label>
                    <div className="relative">
                      <input
                        id="register-password-input"
                        type="password"
                        placeholder="••••••••••••"
                        value={regPassword}
                        onChange={(e) => setRegPassword(e.target.value)}
                        className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl text-xs font-semibold focus:border-slate-800 bg-slate-50 focus:bg-white outline-none"
                        required
                      />
                      <Lock className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* 4 Digit Transaction PIN */}
                  <div className="flex flex-col gap-1" id="reg-pin-field">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">4 Digit Transaction PIN (ATM Access)</label>
                    <div className="relative">
                      <input
                        id="register-pin-input"
                        type="password"
                        placeholder="e.g. 1111"
                        value={regPin}
                        onChange={(e) => setRegPin(e.target.value.replace(/[^0-9]/g, '').slice(0, 4))}
                        className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl text-center text-sm font-bold tracking-widest font-mono bg-slate-50 focus:bg-white outline-none"
                        maxLength={4}
                        required
                      />
                      <KeyRound className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Referral Code (Optional Field) */}
                  <div className="flex flex-col gap-1" id="reg-referral-field">
                    <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider font-display">Referral Code (Optional)</label>
                    <div className="relative">
                      <input
                        id="register-referral-input"
                        type="text"
                        placeholder="e.g. TOPUP-9NGA-77"
                        value={regReferral}
                        onChange={(e) => setRegReferral(e.target.value.toUpperCase())}
                        className="w-full p-2.5 pl-8 border border-slate-200 rounded-xl text-xs font-semibold font-mono bg-slate-50 focus:bg-white outline-none"
                      />
                      <Sparkles className="absolute left-2.5 top-3 w-3.5 h-3.5 text-slate-400" />
                    </div>
                  </div>

                  {/* Custom welcome bonus indicator */}
                  <div className="text-[10px] text-indigo-700 bg-indigo-50/50 p-2 rounded-xl border border-indigo-100 leading-normal flex items-center gap-1.5 justify-center">
                    💖 <span>Get <strong>₦100</strong> instantly in your newly activated account!</span>
                  </div>

                  <button
                    id="auth-submit-btn"
                    type="submit"
                    className="w-full py-3 mt-1 text-white bg-slate-900 border border-slate-950 hover:bg-black rounded-xl font-bold font-display text-xs tracking-wider uppercase hover:shadow-md transition-all active:scale-95"
                  >
                    Create Account & Login
                  </button>
                </form>
              ) : loginStep === 'identifier' ? (
                /* ============= LOGIN SCREEN: IDENTIFIER SELECTION (Step 1) ============= */
                <form onSubmit={handleContinueLogin} className="flex flex-col gap-5">
                  <div className="flex flex-col gap-3">
                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest font-display">
                      How would you like to sign in?
                    </label>

                    {/* Sliding selector tabs */}
                    <div className="grid grid-cols-2 bg-slate-100 p-1 rounded-xl text-xs font-bold font-display uppercase tracking-wider relative">
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('email');
                          setLoginInput('');
                        }}
                        className={`py-2 rounded-lg transition-all ${
                          loginMethod === 'email'
                            ? 'bg-white text-slate-900 shadow-sm font-black'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Email Address
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLoginMethod('phone');
                          setLoginInput('');
                        }}
                        className={`py-2 rounded-lg transition-all ${
                          loginMethod === 'phone'
                            ? 'bg-white text-slate-900 shadow-sm font-black'
                            : 'text-slate-500 hover:text-slate-700'
                        }`}
                      >
                        Phone Number
                      </button>
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">
                      {loginMethod === 'email' ? 'Registered Email Address' : 'Registered Phone Number'}
                    </label>
                    <div className="relative">
                      <input
                        id="login-identifier-input"
                        type={loginMethod === 'email' ? 'email' : 'text'}
                        placeholder={loginMethod === 'email' ? 'customer@wavie.ng' : 'e.g. 08034567890'}
                        value={loginInput}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLoginInput(loginMethod === 'phone' ? val.replace(/[^0-9]/g, '') : val);
                        }}
                        maxLength={loginMethod === 'phone' ? 11 : undefined}
                        className="w-full p-3.5 pl-11 border border-slate-205 rounded-xl text-xs font-semibold focus:border-slate-800 bg-slate-50 focus:bg-white outline-none"
                        required
                      />
                      <div className="absolute left-3.5 top-3.5 text-slate-400">
                        {loginMethod === 'email' ? <Mail className="w-4 h-4" /> : <Phone className="w-4 h-4" />}
                      </div>
                    </div>
                  </div>

                  <button
                    id="continue-login-btn"
                    type="submit"
                    disabled={isVerifyingLogin}
                    className="w-full py-3.5 mt-2 text-white bg-slate-900 border border-slate-950 hover:bg-black rounded-xl font-bold font-display text-sm hover:shadow-md transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <span>Continue to PIN Verification</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>
              ) : (
                /* ============= LOGIN SCREEN: PIN ENTRY (Step 2) ============= */
                <div className="flex flex-col gap-5 text-center">
                  <div className="flex flex-col items-center justify-center gap-2">
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center border border-slate-150 shadow-sm">
                      <KeyRound className="w-5 h-5 text-indigo-600 animate-pulse" />
                    </div>
                    <div className="mt-1">
                      <h3 className="font-display font-black text-slate-800 text-sm tracking-wide uppercase">
                        Access Key Required
                      </h3>
                      <p className="text-[11px] text-slate-400 font-medium">
                        Enter your secure 4-digit PIN for:
                      </p>
                      <code className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 inline-block mt-1">
                        {loginInput}
                      </code>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 relative">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display block">
                      Wallet Security PIN
                    </label>
                    <div className="relative max-w-[200px] mx-auto">
                      <input
                        id="login-pin-input"
                        type="password"
                        placeholder="••••"
                        value={loginPin}
                        onChange={(e) => {
                          const val = e.target.value.replace(/[^0-9]/g, '').substring(0, 4);
                          setLoginPin(val);
                          if (val.length === 4) {
                            handleVerifyPin(val);
                          }
                        }}
                        maxLength={4}
                        autoFocus
                        className="w-full p-3 border border-slate-300 rounded-xl text-lg font-mono tracking-widest font-black text-center bg-slate-50 focus:bg-white outline-none text-slate-900"
                        required
                      />
                      <div className="absolute left-3.5 top-3.5 text-slate-400 pointer-events-none">
                        <Lock className="w-4 h-4" />
                      </div>
                    </div>
                    
                    <div className="p-2 text-[10px] text-slate-400 font-sans leading-relaxed">
                      💡 <strong>Demo Guidance:</strong> Default seed account PIN protection is <code>1111</code>. Typing 4 digits checks auth immediately.
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <p className="text-[11px] text-slate-400 font-medium">Not your account credential line?</p>
                    <button
                      type="button"
                      onClick={() => {
                        setLoginStep('identifier');
                        setLoginPin('');
                      }}
                      className="text-xs font-bold text-indigo-650 hover:underline uppercase tracking-wider"
                    >
                      ← Back to Change Account
                    </button>
                  </div>
                </div>
              )}

              {/* Toggle registering */}
              <div className="mt-6 text-center flex flex-col gap-2.5 border-t border-slate-50 pt-4">
                <button
                  id="toggle-register-btn"
                  onClick={() => setIsRegistering(!isRegistering)}
                  className="text-xs text-indigo-650 hover:text-indigo-850 font-bold font-display uppercase tracking-wide"
                >
                  {isRegistering 
                    ? 'Already have an account? Login here' 
                    : "New to Wavie? Secure an account here"}
                </button>
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
            
            {/* UNIFIED TOP BAR FOR NAV, USER, NOTIFICATIONS (Top Left Focus Navigation, Top Right Actions) */}
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 mb-6 border-b border-slate-205">
               {/* Left side: Navigation links row */}
               <div className="flex items-center gap-3 flex-wrap">
                  {/* Top-left Quick-Navigation Row */}
                  <nav className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                    {menuItems.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        id={`top-navigation-link-${item.id}`}
                        onClick={() => {
                          setActiveTab(item.id as ActiveTab);
                          setShowNotifications(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] sm:text-xs font-bold font-sans transition-all active:scale-95 cursor-pointer ${
                          activeTab === item.id
                            ? 'bg-slate-900 text-white shadow-sm'
                            : 'text-slate-650 hover:bg-slate-200'
                        }`}
                      >
                        {item.icon}
                        <span className="hidden sm:inline">{item.label}</span>
                      </button>
                    ))}
                  </nav>
               </div>

               {/* Right side: Notification and User Account Info */}
               <div className="flex items-center gap-3 justify-end ml-auto">
                  {/* Notification Bell with Badge */}
                  <div className="relative">
                     <button
                       id="top-notification-bell-btn"
                       onClick={() => setShowNotifications(!showNotifications)}
                       className="p-2 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 rounded-full transition-all active:scale-95 shadow-sm relative cursor-pointer"
                     >
                       <Bell className="w-4 h-4 text-slate-600" />
                       <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 rounded-full text-[9px] font-bold text-slate-950 flex items-center justify-center shadow-sm">
                         3
                       </span>
                     </button>

                     {showNotifications && (
                       <div 
                         id="notifications-dropdown-menu"
                         className="absolute right-0 mt-3 w-[290px] sm:w-[360px] bg-white border border-slate-100 rounded-2xl shadow-xl z-50 p-4 animate-scale-in"
                       >
                         <div className="flex items-center justify-between pb-2 border-b border-slate-100 mb-3">
                           <span className="text-xs font-bold text-slate-800 font-display uppercase tracking-wider">Active Alerts</span>
                           <span className="text-[9px] font-extrabold text-amber-600 px-1.5 py-0.5 bg-amber-50 rounded-full">3 Active</span>
                         </div>
                         <div className="flex flex-col gap-3 max-h-72 overflow-y-auto no-scrollbar">
                           <div className="p-2.5 bg-emerald-50/40 rounded-xl border border-emerald-100 flex gap-2.5">
                             <div className="p-1 text-emerald-700 bg-emerald-100 rounded h-max mt-0.5">
                               <Check className="w-3 h-3" />
                             </div>
                             <div className="flex flex-col text-left">
                               <span className="text-[10px] font-bold text-slate-800 font-display">Fast Auto-Funding Active</span>
                               <span className="text-[10px] text-slate-500 leading-tight">Virtual Bank Auto-Funding is fully operational for instantaneous delivery.</span>
                               <span className="text-[8px] text-slate-400 mt-1 font-mono">Just Now</span>
                             </div>
                           </div>
                           <div className="p-2.5 bg-amber-50/40 rounded-xl border border-amber-100 flex gap-2.5">
                             <div className="p-1 text-amber-700 bg-amber-100 rounded h-max mt-0.5">
                               <Sparkles className="w-3 h-3" />
                             </div>
                             <div className="flex flex-col text-left">
                               <span className="text-[10px] font-bold text-slate-800 font-display">MTN SME Data Slash!</span>
                               <span className="text-[10px] text-slate-500 leading-tight">Prices dropped to ₦235/GB. Select with code SMEFLASH.</span>
                               <span className="text-[8px] text-amber-600 mt-1 font-mono">1 Hour Ago</span>
                             </div>
                           </div>
                           <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-150 flex gap-2.5">
                             <div className="p-1 text-slate-600 bg-slate-200 rounded h-max mt-0.5">
                               <ShieldCheck className="w-3 h-3" />
                             </div>
                             <div className="flex flex-col text-left">
                               <span className="text-[10px] font-bold text-slate-800 font-display">Identity State Clear</span>
                               <span className="text-[10px] text-slate-500 leading-tight">Account verification has passed Tier-1 limit standards.</span>
                               <span className="text-[8px] text-slate-400 mt-1 font-mono">2 Days Ago</span>
                             </div>
                           </div>
                         </div>
                       </div>
                     )}
                  </div>

                  {/* User Profile avatar picture only, no name text displaying */}
                  <div 
                    id="top-user-profile-capsule"
                    onClick={() => {
                      setActiveTab('settings');
                      addToast('Navigated to profile configurations', 'info');
                    }}
                    className="flex items-center p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <div className="w-8 h-8 rounded-full relative">
                      <img 
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                        alt="User Profile"
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                  </div>

                  {/* Right side status indicator */}
                  <div className="hidden sm:flex items-center gap-2">
                    <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono select-none">
                      Wavie Portal ⚡
                    </span>
                    <button
                      id="top-right-logout-btn"
                      onClick={() => {
                        setIsAuthenticated(false);
                        addToast('Logged out.', 'info');
                      }}
                      className="p-1.5 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-500 rounded-full transition-all active:scale-95 border border-slate-200 cursor-pointer"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                    </button>
                  </div>
               </div>
            </header>

            {/* MAIN PORTLET TAB RENDERING */}
            <div className="flex-grow">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -12 }}
                  transition={{ duration: 0.25, ease: [0.215, 0.61, 0.355, 1] }}
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
                      onUpdateUser={(updated) => {
                        fetch('/api/user/update', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ email: user.email, ...updated })
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success && data.user) {
                            setUser(data.user);
                            addToast('Profile updated in SQL Database', 'success');
                          }
                        })
                        .catch(err => {
                          console.error(err);
                          setUser((prev) => ({ ...prev, ...updated }));
                        });
                      }}
                      lang={lang}
                      onChangeLang={(l) => setLang(l)}
                      addToast={addToast}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
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
