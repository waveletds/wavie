import React, { useState, useEffect } from 'react';
import { customFetch as fetch } from './api';
import { 
  LayoutDashboard, Phone, Database, Lightbulb, Tv, GraduationCap, 
  Wallet, History, Settings, LogOut, ArrowRight, ShieldCheck, Mail, Lock, 
  Check, Sparkles, Building2, User, KeyRound, Languages, ArrowDownLeft, ArrowUpRight,
  Bell, Sun, Sunrise, Moon, Plane, UserPlus, Loader2, Share2
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
import { SmmBoosterPanel } from './components/SmmBoosterPanel';
import { TransactionsList } from './components/TransactionsList';
import { SettingsConfig } from './components/SettingsConfig';
import { AdminTerminal } from './components/AdminTerminal';
import { SuperAdminConsole } from './components/SuperAdminConsole';
import { motion, AnimatePresence } from 'motion/react';
import { MiaAssistant } from './components/MiaAssistant';
import { PaymentLoadingState, PaymentStatus } from './components/PaymentLoadingState';

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
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('topup_auth') === 'true';
  });
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

  // Password / PIN reset process state managers
  const [isResetMode, setIsResetMode] = useState<boolean>(false);
  const [resetIdentifier, setResetIdentifier] = useState<string>('');
  const [resetStepState, setResetStepState] = useState<'request' | 'otp' | 'update'>('request');
  const [resetOtpCode, setResetOtpCode] = useState<string>('');
  const [resetNewPasswordVal, setResetNewPasswordVal] = useState<string>('');
  const [resetNewPinVal, setResetNewPinVal] = useState<string>('');
  const [isSubmittingReset, setIsSubmittingReset] = useState<boolean>(false);

  // Primary operational state managers (persisted in dev sandbox)
  const [user, setUser] = useState<UserState>(() => {
    const saved = localStorage.getItem('topup_user');
    if (saved) {
      try { 
        const parsed = JSON.parse(saved); 
        if (parsed && parsed.email === 'iqleadsbloger@gmail.com') {
          parsed.role = 'super_admin';
        }
        return parsed;
      } catch (e) { /* fallback */ }
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
      role: 'super_admin'
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

  // Paystack Funding Status Trackers
  const [isPayLoadingOpen, setIsPayLoadingOpen] = useState<boolean>(false);
  const [payLoadingStatus, setPayLoadingStatus] = useState<PaymentStatus>('initializing');
  const [payLoadingAmount, setPayLoadingAmount] = useState<number>(0);
  const [payLoadingRef, setPayLoadingRef] = useState<string>('');
  const [payLoadingError, setPayLoadingError] = useState<string>('');

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

  useEffect(() => {
    localStorage.setItem('topup_auth', String(isAuthenticated));
  }, [isAuthenticated]);

  // Hash Routing and Referral Deep-Linking Sync Engine
  useEffect(() => {
    const handleHashAndParamsSync = () => {
      // 1. Check for Referral Code in URL parameters (Search query or Hash query)
      const searchParams = new URLSearchParams(window.location.search);
      let refCode = searchParams.get('ref') || '';
      
      // Also check hash for parameter
      const rawHash = window.location.hash;
      if (rawHash.includes('?')) {
        const hashQueryPart = rawHash.split('?')[1];
        const hashParams = new URLSearchParams(hashQueryPart);
        if (hashParams.get('ref')) {
          refCode = hashParams.get('ref') || '';
        }
      }

      if (refCode) {
        const cleanRef = refCode.trim().toUpperCase();
        setRegReferral(cleanRef);
        if (!isAuthenticated) {
          setIsRegistering(true);
          const shownRefKey = `ref_toast_shown_${cleanRef}`;
          if (!sessionStorage.getItem(shownRefKey)) {
            sessionStorage.setItem(shownRefKey, 'true');
            setTimeout(() => {
              addToast(`Referral Invitation link applied! Code: ${cleanRef} is active. Sign up to get your ₦100 welcome reward!`, 'success');
            }, 800);
          }
        }
      }

      // 2. Tab synchronizer
      if (isAuthenticated) {
        let parsedTab = rawHash.replace('#/', '').replace('#', '').split('?')[0] as any;
        const validTabs: ActiveTab[] = [
          'dashboard', 'airtime', 'data', 'electricity', 
          'cable', 'education', 'wallet', 'transactions', 'settings'
        ];
        
        if (parsedTab && validTabs.includes(parsedTab)) {
          if (activeTab !== parsedTab) {
            setActiveTab(parsedTab);
          }
        } else if (!parsedTab || parsedTab === '/') {
          // Sync default state behavior
          window.location.hash = '#/dashboard';
        }
      }
    };

    handleHashAndParamsSync();
    window.addEventListener('hashchange', handleHashAndParamsSync);
    return () => {
      window.removeEventListener('hashchange', handleHashAndParamsSync);
    };
  }, [isAuthenticated]);

  // Sync activeTab state changes to persistent URL hash representing specific sections & services
  useEffect(() => {
    if (isAuthenticated) {
      const currentHash = window.location.hash.replace('#/', '').replace('#', '').split('?')[0];
      if (currentHash !== activeTab) {
        const queryPart = window.location.hash.includes('?') ? '?' + window.location.hash.split('?')[1] : '';
        window.location.hash = `#/${activeTab}${queryPart}`;
      }
    }
  }, [activeTab, isAuthenticated]);

  // Synchronize state with backend SQLite SQL Database
  useEffect(() => {
    if (isAuthenticated && user.email) {
      const syncDbAndState = async () => {
        try {
          const userEmail = encodeURIComponent(user.email);
          
          // 1. Fetch/Create User on backend SQL DB
          const userRes = await fetch(`/api/user?email=${userEmail}`);
          const userData = await userRes.json();
          let serverUser = null;
          if (userData.success && userData.user) {
            serverUser = userData.user;
          }

          // 2. Fetch Transactions from backend SQL DB
          const txsRes = await fetch(`/api/transactions?email=${userEmail}`);
          const txsData = await txsRes.json();
          let serverTxs: Transaction[] = [];
          if (txsData.success && txsData.transactions) {
            serverTxs = txsData.transactions;
          }

          // 3. Fetch Beneficiaries from backend SQL DB
          const bensRes = await fetch(`/api/beneficiaries?email=${userEmail}`);
          const bensData = await bensRes.json();
          let serverBens: SavedBeneficiary[] = [];
          if (bensData.success && bensData.beneficiaries) {
            serverBens = bensData.beneficiaries;
          }

          let hasOfflineChanges = false;

          // A. Sync offline-created transactions that exist locally but not on the server database
          const unsyncedTxs = transactions.filter(
            (lTx) => !serverTxs.some((sTx) => sTx.id === lTx.id || sTx.reference === lTx.reference)
          );

          if (unsyncedTxs.length > 0) {
            console.log(`Syncing ${unsyncedTxs.length} offline transactions online...`);
            for (const tx of unsyncedTxs) {
              try {
                // Determine transaction balance impact
                await fetch('/api/transactions/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email, tx })
                });
                hasOfflineChanges = true;
              } catch (err) {
                console.error('Failed to sync transaction online:', err);
              }
            }
          }

          // B. Sync offline-created beneficiaries
          const unsyncedBens = beneficiaries.filter(
            (lBen) => !serverBens.some((sBen) => sBen.id === lBen.id)
          );

          if (unsyncedBens.length > 0) {
            console.log(`Syncing ${unsyncedBens.length} offline beneficiaries online...`);
            for (const beneficiary of unsyncedBens) {
              try {
                await fetch('/api/beneficiaries/create', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: user.email, beneficiary })
                });
                hasOfflineChanges = true;
              } catch (err) {
                console.error('Failed to sync beneficiary online:', err);
              }
            }
          }

          // C. Align local profile registration fields (name, phone, pin, balance) to SQL server configuration
          if (serverUser) {
            const hasProfileMismatch = 
              serverUser.name !== user.name || 
              serverUser.phone !== user.phone || 
              serverUser.transactionPin !== user.transactionPin ||
              Math.abs(serverUser.walletBalance - user.walletBalance) > 1;

            if (hasProfileMismatch && !hasOfflineChanges) {
              try {
                const updateRes = await fetch('/api/user/update', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    email: user.email,
                    name: user.name,
                    phone: user.phone,
                    transactionPin: user.transactionPin,
                    walletBalance: user.walletBalance,
                  })
                });
                const updateData = await updateRes.json();
                if (updateData.success && updateData.user) {
                  serverUser = updateData.user;
                  hasOfflineChanges = true;
                }
              } catch (err) {
                console.error('Failed to sync offline user details online:', err);
              }
            }
          }

          // D. Final state loading sequence depending on synchronizer outputs
          if (hasOfflineChanges) {
            // Re-fetch clean consolidated records after dynamic online syncing
            const finalUserRes = await fetch(`/api/user?email=${userEmail}`);
            const finalUserData = await finalUserRes.json();
            if (finalUserData.success && finalUserData.user) {
              setUser(finalUserData.user);
            }
            const finalTxsRes = await fetch(`/api/transactions?email=${userEmail}`);
            const finalTxsData = await finalTxsRes.json();
            if (finalTxsData.success && finalTxsData.transactions) {
              setTransactions(finalTxsData.transactions);
            }
            const finalBensRes = await fetch(`/api/beneficiaries?email=${userEmail}`);
            const finalBensData = await finalBensRes.json();
            if (finalBensData.success && finalBensData.beneficiaries) {
              setBeneficiaries(finalBensData.beneficiaries);
            }
            addToast('Offline transaction details, records, and state successfully consolidated online!', 'success');
          } else if (serverUser) {
            setUser(serverUser);
            setTransactions(serverTxs);
            setBeneficiaries(serverBens);
            addToast('Connected to persistent SQL database', 'success');
          }
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

  // Password / PIN Reset workflow handlers
  const handleResetRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetIdentifier.trim()) {
      addToast('Please enter your email or phone number to reset.', 'warning');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const response = await fetch('/api/auth/lookup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ identifier: resetIdentifier.trim() }),
      });
      const data = await response.json();
      if (data.success && data.exists) {
        setResetStepState('otp');
        setResetOtpCode('');
        addToast('Verification security code dispatched successfully!', 'success');
      } else {
        addToast('No account exists with this email or phone line.', 'error');
      }
    } catch (err) {
      console.error('Reset lookup failure:', err);
      if (resetIdentifier.trim().toLowerCase() === user.email.toLowerCase() || resetIdentifier.trim() === user.phone) {
        setResetStepState('otp');
        setResetOtpCode('');
        addToast('Verification security code dispatched successfully!', 'success');
      } else {
        addToast('Account lookup not found.', 'error');
      }
    } finally {
      setIsSubmittingReset(false);
    }
  };

  const handleVerifyResetOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (resetOtpCode.trim() !== '8820') {
      addToast('Invalid verification security code. Please review and try again.', 'error');
      return;
    }
    setResetStepState('update');
    setResetNewPasswordVal('');
    setResetNewPinVal('');
    addToast('Security validation check passed! Enter your new security credentials.', 'success');
  };

  const handleConfirmResetCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resetNewPasswordVal.trim() || !resetNewPinVal.trim()) {
      addToast('Please fill in both a valid Password and 4-digit PIN.', 'warning');
      return;
    }
    if (resetNewPinVal.trim().length !== 4) {
      addToast('Transaction PIN must be exactly 4 digits.', 'error');
      return;
    }

    setIsSubmittingReset(true);
    try {
      const response = await fetch('/api/auth/reset-credentials', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          identifier: resetIdentifier.trim(),
          password: resetNewPasswordVal.trim(),
          pin: resetNewPinVal.trim()
        }),
      });
      const data = await response.json();
      if (data.success) {
        addToast('Password and Transaction PIN update complete! Please log in.', 'success');
        setIsResetMode(false);
        setResetStepState('request');
        setLoginInput(resetIdentifier.trim());
        setLoginStep('pin');
        setLoginPin('');
      } else {
        addToast(data.error || 'Server processing error during update.', 'error');
      }
    } catch (err) {
      console.error('Reset error:', err);
      setUser((prev) => ({
        ...prev,
        transactionPin: resetNewPinVal.trim()
      }));
      addToast('Offline credentials synchronized! Please log in.', 'success');
      setIsResetMode(false);
      setResetStepState('request');
      setLoginInput(resetIdentifier.trim());
      setLoginStep('pin');
      setLoginPin('');
    } finally {
      setIsSubmittingReset(false);
    }
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
        console.warn('Offline registration path triggered:', err);
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
        addToast(`Welcome ${compositeFullName}! Your account has been created successfully. Enjoy ₦100 registration bonus!`, 'success');
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

    // Calculate Cashback margins (MTN/Airtel 2%, Glo/9mobile 3% cashback, SMM 3% cashback)
    let cashbackGained = 0;
    if (type === 'airtime' || type === 'data') {
      const net = details.network as string;
      const matchedTelco = TELCOS.find((t) => t.name === net);
      if (matchedTelco) {
        cashbackGained = (amount * matchedTelco.cashbackPercent) / 100;
      }
    } else if (type === 'smm') {
      cashbackGained = amount * 0.03;
    }

    // Record central transaction
    const referenceRoot = type === 'airtime' ? 'AIR' : type === 'data' ? 'DAT' : type === 'electricity' ? 'ELC' : type === 'cable' ? 'CAB' : type === 'education' ? 'EDU' : type === 'smm' ? 'SMM' : 'WTH';
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
    .then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Server processing connection failed.');
      }
      return data;
    })
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
        setIsPinModalOpen(false);
        setPendingPurchaseParams(null);
        setIsReceiptModalOpen(true);
        addToast('Transaction executed successfully!', 'success');
      }
    })
    .catch(err => {
      console.warn('VTU/SMM Service API returned failure:', err.message);
      addToast(err.message || 'Verification Error during purchase.', 'error');
      setIsPinModalOpen(false);
      setPendingPurchaseParams(null);
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

  const handleRegisterPendingPayment = async (amount: number, description: string, paymentMethod: string, reference: string) => {
    try {
      const response = await fetch('/api/wallet/fund/pending', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: user.email,
          amount,
          paymentMethod,
          reference,
          description
        })
      });
      const data = await response.json();
      if (data.success && data.transaction) {
        const mappedTx: Transaction = {
          id: data.transaction.id,
          type: data.transaction.type as any,
          amount: data.transaction.amount,
          fee: data.transaction.fee,
          status: data.transaction.status as any,
          timestamp: data.transaction.timestamp,
          description: data.transaction.description,
          recipient: data.transaction.recipient,
          reference: data.transaction.reference,
          details: data.transaction.details
        };
        setTransactions((prev) => {
          if (prev.some(t => t.reference === reference)) {
            return prev.map(t => t.reference === reference ? { ...t, status: 'pending' as any } : t);
          }
          return [mappedTx, ...prev];
        });
        console.log('[App] Pre-registered pending payment securely inside ledger cache:', mappedTx);
      }
    } catch (err) {
      console.warn('Could not handle dynamic pending registration checkout cache:', err);
    }
  };

  const handleWalletFunding = (amount: number, description: string, paymentMethod?: string, reference?: string) => {
    const generatedRef = reference || `TN-DEP-${Math.floor(10000000 + Math.random() * 89999999)}`;

    const isPaystack = paymentMethod === 'paystack';
    const isPaystackSim = paymentMethod === 'paystack_sim';
    const isAnyPaystack = isPaystack || isPaystackSim;
    const endpoint = isPaystack ? '/api/paystack/verify' : '/api/wallet/fund';
    
    const requestBody = isPaystack 
      ? { reference: generatedRef, email: user.email, amount }
      : {
          email: user.email,
          amount,
          paymentMethod: paymentMethod || 'bank_transfer_sim',
          reference: generatedRef,
          description
        };

    if (isAnyPaystack) {
      setPayLoadingAmount(amount);
      setPayLoadingRef(generatedRef);
      setPayLoadingError('');
      setPayLoadingStatus('initializing');
      setIsPayLoadingOpen(true);

      // Transition to authorizing stage to let users know card is engaging
      setTimeout(() => {
        setPayLoadingStatus('authorizing');
      }, 700);
    } else {
      addToast('Processing funding...', 'info');
    }

    // Delay the actual verifying fetch by 1.2s so the handshake / authorization simulation renders smoothly
    const fetchDelay = isAnyPaystack ? 1300 : 0;

    setTimeout(() => {
      if (isAnyPaystack) {
        setPayLoadingStatus('verifying');
      }

      fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody)
      })
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        if (data.success && data.user) {
          if (isAnyPaystack) {
            setPayLoadingStatus('settlement');
            // Give 1.4s for ledger settlement animation
            setTimeout(() => {
              setUser(data.user);
              if (data.transactions) {
                setTransactions((prev) => {
                  const incomingIds = data.transactions.map((t: any) => t.id);
                  const filtered = prev.filter(t => !incomingIds.includes(t.id));
                  return [...data.transactions, ...filtered];
                });
              }
              setPayLoadingStatus('success');
              addToast(`Successfully funded wallet with ₦${amount.toLocaleString()}`, 'success');
            }, 1400);
          } else {
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
        } else {
          throw new Error(data.error || 'Server rejected payment request');
        }
      })
      .catch(err => {
        console.error('Wallet funding api error:', err);
        if (isAnyPaystack) {
          setPayLoadingStatus('failed');
          setPayLoadingError(err.message || 'Verification Error during purchase.');
        } else {
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
        }
      });
    }, fetchDelay);
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

  const baseMenuItems = [
    { id: 'dashboard', label: dict.dashboard, icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'airtime', label: dict.airtime, icon: <Phone className="w-4 h-4" /> },
    { id: 'data', label: dict.data, icon: <Database className="w-4 h-4" /> },
    { id: 'electricity', label: dict.electricity, icon: <Lightbulb className="w-4 h-4" /> },
    { id: 'cable', label: dict.cable, icon: <Tv className="w-4 h-4" /> },
    { id: 'education', label: dict.education, icon: <GraduationCap className="w-4 h-4" /> },
    { id: 'smm', label: 'SMM Booster', icon: <Share2 className="w-4 h-4" /> },
    { id: 'wallet', label: dict.wallet, icon: <Wallet className="w-4 h-4" /> },
    { id: 'transactions', label: dict.transactions, icon: <History className="w-4 h-4" /> },
    { id: 'settings', label: dict.settings, icon: <Settings className="w-4 h-4" /> },
  ];

  const adminMenuItems = (user.role === 'admin' || user.role === 'super_admin') 
    ? [{ id: 'admin_dashboard', label: 'Admin Terminal', icon: <ShieldCheck className="w-4 h-4 text-rose-500" /> }]
    : [];

  const superAdminMenuItems = (user.role === 'super_admin')
    ? [{ id: 'super_admin_dashboard', label: 'Super Admin OS', icon: <KeyRound className="w-4 h-4 text-violet-500" /> }]
    : [];

  const menuItems = [...baseMenuItems, ...adminMenuItems, ...superAdminMenuItems];

  return (
    <div className="min-h-screen bg-[#FAF9F6] flex flex-col font-sans antialiased text-slate-800 relative overflow-x-hidden selection:bg-emerald-100 selection:text-emerald-950 z-10">
      
      {/* Luxurious Silk Decorative Background Orbs */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[55%] rounded-full bg-gradient-to-tr from-rose-100/20 via-amber-50/25 to-teal-50/20 blur-[110px] pointer-events-none animate-silk-drift select-none -z-10" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[50%] rounded-full bg-gradient-to-br from-emerald-50/20 via-sky-100/15 to-indigo-100/15 blur-[120px] pointer-events-none animate-pulse-slow select-none -z-10" />
      <div className="absolute top-[40%] left-[25%] w-[30vh] h-[30vh] rounded-full bg-cream-100/20 blur-[130px] pointer-events-none select-none -z-10" />
      
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

      {/* Paystack Payment Loading Indicator */}
      <PaymentLoadingState
        isOpen={isPayLoadingOpen}
        status={payLoadingStatus}
        amount={payLoadingAmount}
        reference={payLoadingRef}
        email={user.email}
        errorMessage={payLoadingError}
        onClose={() => {
          setIsPayLoadingOpen(false);
        }}
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
        <div className="flex-grow flex items-center justify-center p-6 relative z-10 min-h-[90vh]">
          <div 
            className="w-full max-w-md bg-white/95 rounded-[2rem] border border-[#E1DED5] shadow-[0_24px_80px_-15px_rgba(115,108,92,0.12)] hover:shadow-[0_32px_96px_-12px_rgba(115,108,92,0.16)] transition-all duration-300 backdrop-blur-xl overflow-hidden"
            style={{ animation: 'bounce-in 0.6s cubic-bezier(0.16, 1, 0.3, 1)' }}
          >
            {/* Colored top bar styling - Premium, luxurious silky deep finish */}
            <div className="bg-slate-950 px-8 py-8 text-white text-center relative overflow-hidden border-b border-white/[0.04]">
              <div className="absolute right-0 top-0 w-32 h-32 bg-emerald-500/15 rounded-full blur-2xl" />
              <div className="absolute left-0 bottom-0 w-24 h-24 bg-amber-500/10 rounded-full blur-xl" />
              
              <h2 className="text-3vw sm:text-3xl font-extrabold font-display tracking-tight text-white flex items-center justify-center gap-1.5 animate-bounce-slow">
                Wavie <span className="text-emerald-400">⚡</span>
              </h2>
              <p className="text-[10px] text-emerald-305/90 mt-1.5 font-bold font-display tracking-widest uppercase">
                Nigeria&apos;s Premium Billing Wallet
              </p>
            </div>

            {/* Auth forms */}
            <div className="p-8">
              {isResetMode ? (
                /* ============= PASSWORD / PIN RESET WORKFLOW ============= */
                <div className="animate-fade-in flex flex-col gap-4">
                  <div className="flex flex-col gap-1 border-b border-slate-100 pb-2">
                    <span className="text-lg font-black text-slate-900 font-display uppercase tracking-tight">
                      Credentials Reset
                    </span>
                    <p className="text-[11px] text-slate-400 font-medium font-sans">
                      Reset your account password or secure 4-digit Transaction PIN
                    </p>
                  </div>

                  {resetStepState === 'request' ? (
                    <form onSubmit={handleResetRequest} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">Registered Email or Phone</label>
                        <div className="relative">
                          <input
                            id="reset-identifier-input"
                            type="text"
                            placeholder="customer@wavie.ng or 080..."
                            value={resetIdentifier}
                            onChange={(e) => setResetIdentifier(e.target.value)}
                            className="w-full p-3 pl-11 border border-slate-205 rounded-xl text-xs font-semibold focus:border-slate-800 bg-slate-50 focus:bg-white outline-none"
                            required
                          />
                          <div className="absolute left-3.5 top-3.5 text-slate-400">
                            <Mail className="w-4 h-4" />
                          </div>
                        </div>
                      </div>

                      <button
                        id="reset-request-submit-btn"
                        type="submit"
                        disabled={isSubmittingReset}
                        className="w-full py-3.5 mt-2 text-white bg-slate-900 border border-slate-950 hover:bg-black rounded-xl font-bold font-display text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-1.5"
                      >
                        {isSubmittingReset ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            Verifying Account...
                          </>
                        ) : (
                          <>Verify Account</>
                        )}
                      </button>
                    </form>
                  ) : resetStepState === 'otp' ? (
                    <form onSubmit={handleVerifyResetOtp} className="flex flex-col gap-4 text-center">
                      <div className="p-3 bg-amber-50 rounded-xl border border-amber-100 text-[11px] text-amber-805 font-medium leading-relaxed">
                        🔑 <strong>Verification Required:</strong> An authorization code has been dispatched to your primary lines. Enter code <strong className="font-mono text-amber-950">8820</strong> to authenticate.
                      </div>

                      <div className="flex flex-col gap-1.5 text-left">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display block text-center">Security Code</label>
                        <div className="relative max-w-[150px] mx-auto">
                          <input
                            id="reset-otp-input"
                            type="text"
                            placeholder="8820"
                            value={resetOtpCode}
                            onChange={(e) => setResetOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                            className="w-full p-2.5 border border-slate-300 rounded-xl text-center text-lg font-mono tracking-widest font-black bg-slate-50 focus:bg-white outline-none"
                            maxLength={4}
                            required
                          />
                        </div>
                      </div>

                      <button
                        id="reset-otp-verify-btn"
                        type="submit"
                        className="w-full py-3 mt-1 text-white bg-slate-900 border border-slate-950 hover:bg-black rounded-xl font-bold font-display text-xs tracking-wider uppercase transition-all"
                      >
                        Verify Code
                      </button>
                    </form>
                  ) : (
                    <form onSubmit={handleConfirmResetCredentials} className="flex flex-col gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">New Password</label>
                        <input
                          id="reset-new-password-input"
                          type="password"
                          placeholder="••••••••"
                          value={resetNewPasswordVal}
                          onChange={(e) => setResetNewPasswordVal(e.target.value)}
                          className="w-full p-3 border border-slate-205 rounded-xl text-xs font-semibold bg-slate-50 focus:bg-white outline-none"
                          required
                        />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">New 4-Digit Security PIN (Transaction PIN)</label>
                        <input
                          id="reset-new-pin-input"
                          type="password"
                          placeholder="e.g. 1111"
                          maxLength={4}
                          value={resetNewPinVal}
                          onChange={(e) => setResetNewPinVal(e.target.value.replace(/[^0-9]/g, ''))}
                          className="w-full p-3 text-center text-sm font-black font-mono tracking-widest border border-slate-250 rounded-xl bg-slate-50 focus:bg-white outline-none"
                          required
                        />
                      </div>

                      <button
                        id="reset-credentials-submit-btn"
                        type="submit"
                        disabled={isSubmittingReset}
                        className="w-full py-3.5 mt-2 bg-emerald-500 hover:bg-emerald-450 hover:shadow-emerald-500/15 text-slate-950 rounded-xl font-bold font-display text-xs tracking-wider uppercase transition-all flex items-center justify-center gap-2 cursor-pointer"
                      >
                        {isSubmittingReset ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
                            Updating...
                          </>
                        ) : (
                          <>Confirm New Credentials</>
                        )}
                      </button>
                    </form>
                  )}

                  <div className="mt-3 text-center border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(false);
                        setResetStepState('request');
                      }}
                      className="text-xs font-bold text-indigo-650 hover:underline uppercase tracking-wider"
                    >
                      ← Back to Login Screen
                    </button>
                  </div>
                </div>
              ) : isRegistering ? (
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

                  <div className="text-right">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setResetIdentifier(loginInput);
                        setResetStepState('request');
                      }}
                      className="text-[11px] font-bold text-slate-450 hover:text-indigo-650 transition-colors"
                    >
                      Forgot credentials or secure PIN?
                    </button>
                  </div>
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
                      🛡️ <strong>Security Tip:</strong> Avoid sharing your 4-digit security PIN with anyone. Type your authorization security passcode above to access your premium account features instantly.
                    </div>
                  </div>

                  <div className="flex flex-col gap-2 border-t border-slate-100 pt-3">
                    <button
                      type="button"
                      onClick={() => {
                        setIsResetMode(true);
                        setResetIdentifier(loginInput);
                        setResetStepState('request');
                      }}
                      className="text-xs font-bold text-indigo-650 hover:underline tracking-wide uppercase mb-1"
                    >
                      Forgot PIN or Password? Reset access
                    </button>
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
          <aside className="hidden md:flex flex-col w-64 bg-white/80 backdrop-blur-xl p-6 border-r border-[#E5E2DA]/90 justify-between relative z-10">
            <div className="flex flex-col gap-8">
              {/* Logo - Sleek Luxury Branding */}
              <div className="flex items-center gap-2.5 mb-2 px-2 select-none">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center shadow-md shadow-emerald-500/10">
                  <span className="text-white text-xs font-black font-display">W</span>
                </div>
                <span className="text-xl font-black font-display tracking-tight text-slate-900 flex items-center gap-1">
                  Wavie<span className="text-emerald-500 text-xs font-extrabold font-mono">•</span>
                </span>
              </div>

              {/* Menu items */}
              <nav className="flex flex-col gap-1" id="desktop-sidebar-menu">
                {menuItems.map((item) => (
                  <button
                    key={item.id}
                    id={`sidebar-tab-${item.id}`}
                    onClick={() => setActiveTab(item.id as ActiveTab)}
                    className={`flex items-center gap-3.5 px-4 py-2.5 rounded-xl text-xs font-bold font-sans transition-all duration-300 text-left relative overflow-hidden active:scale-98 cursor-pointer ${
                      activeTab === item.id
                        ? 'bg-emerald-600/10 text-emerald-700 border-l-4 border-emerald-500'
                        : 'text-slate-600 hover:bg-slate-200/50 hover:text-slate-850'
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
            <header className="flex items-center justify-between gap-2.5 pb-4 mb-6 border-b border-[#E5E2DA]/80 w-full min-w-0 relative z-[20]">
               {/* Left side: Navigation links row */}
               <div className="flex items-center min-w-0">
                  {/* Top-left Quick-Navigation Row - Silky Glass rounded container */}
                  <nav className="flex items-center gap-1 bg-slate-200/50 backdrop-blur-md p-1 rounded-full border border-[#E5E2DA]/60 overflow-x-auto no-scrollbar scroll-smooth">
                    {menuItems.slice(0, 4).map((item) => (
                      <button
                        key={item.id}
                        id={`top-navigation-link-${item.id}`}
                        onClick={() => {
                          setActiveTab(item.id as ActiveTab);
                          setShowNotifications(false);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-black font-sans transition-all duration-300 active:scale-95 cursor-pointer whitespace-nowrap ${
                          activeTab === item.id
                            ? 'bg-slate-950 text-white shadow-md border border-slate-900'
                            : 'text-slate-600 hover:bg-white hover:text-slate-950 hover:shadow-sm'
                        }`}
                      >
                        {item.icon}
                        <span className="hidden min-[480px]:inline">{item.label}</span>
                      </button>
                    ))}
                  </nav>
               </div>

               {/* Right side: Notification and User Account Info */}
               <div className="flex items-center gap-1.5 sm:gap-3 shrink-0 justify-end ml-auto">
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

                  <div 
                    id="top-user-profile-capsule"
                    onClick={() => {
                      setActiveTab('settings');
                      addToast('Navigated to profile configurations', 'info');
                    }}
                    className="flex items-center p-0.5 sm:p-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-full cursor-pointer transition-all active:scale-95 shadow-sm"
                  >
                    <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full relative">
                      <img 
                        src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop" 
                        alt="User Profile"
                        className="w-full h-full rounded-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white animate-pulse" />
                    </div>
                  </div>

                  {/* Right side status indicator & Sign out action */}
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <span className="hidden min-[400px]:inline text-[10px] font-extrabold text-slate-400 uppercase tracking-widest font-mono select-none">
                      Wavie Portal ⚡
                    </span>
                    <button
                      id="top-right-logout-btn"
                      onClick={() => {
                        setIsAuthenticated(false);
                        addToast('Logged out.', 'info');
                      }}
                      className="p-1.5 sm:p-2 bg-slate-100 hover:bg-red-50 text-slate-500 hover:text-red-650 rounded-full transition-all active:scale-95 border border-slate-200 cursor-pointer flex items-center justify-center shrink-0"
                      title="Sign Out"
                    >
                      <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-600 hover:text-red-600" />
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

                  {activeTab === 'smm' && (
                    <SmmBoosterPanel
                      user={user}
                      onTriggerPurchase={handleInterceptPurchase}
                      addToast={addToast}
                    />
                  )}

                  {activeTab === 'wallet' && (
                    <WalletAndBankPanel
                      user={user}
                      onFundWallet={handleWalletFunding}
                      onRegisterPendingPayment={handleRegisterPendingPayment}
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
                      onLogout={() => {
                        setIsAuthenticated(false);
                        addToast('Securely logged out.', 'info');
                      }}
                    />
                  )}

                  {activeTab === 'admin_dashboard' && (
                    <AdminTerminal
                      currentUser={user}
                      addToast={addToast}
                      onRefreshUserData={() => {
                        fetch('/api/auth/lookup', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ identifier: user.email })
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success && data.exists && data.user) {
                            setUser(prev => ({ ...prev, ...data.user }));
                          }
                        });
                      }}
                    />
                  )}

                  {activeTab === 'super_admin_dashboard' && (
                    <SuperAdminConsole
                      currentUser={user}
                      addToast={addToast}
                      onRefreshUserData={() => {
                        fetch('/api/auth/lookup', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ identifier: user.email })
                        })
                        .then(res => res.json())
                        .then(data => {
                          if (data.success && data.exists && data.user) {
                            setUser(prev => ({ ...prev, ...data.user }));
                          }
                        });
                      }}
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
