import React, { useState } from 'react';
import { 
  Building2, CreditCard, ArrowDownLeft, ArrowUpRight, Copy, Check, 
  HelpCircle, ShieldCheck, AlertCircle, RefreshCw, UserCheck, Smartphone, Loader2, Lock, ShieldAlert
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { UserState } from '../types';
import { MOCK_NAMES } from '../data';

const loadPaystackScript = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if ((window as any).PaystackPop) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

interface WalletAndBankPanelProps {
  user: UserState;
  onFundWallet: (amount: number, description: string, paymentMethod?: string, reference?: string) => void;
  onWithdrawWallet: (amount: number, fee: number, description: string, details: any) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const WalletAndBankPanel: React.FC<WalletAndBankPanelProps> = ({
  user,
  onFundWallet,
  onWithdrawWallet,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'fund' | 'withdraw'>('fund');
  const [fundMethod, setFundMethod] = useState<'transfer' | 'card' | 'ussd'>('transfer');

  // Virtual funding mock simulators
  const [fundingAmount, setFundingAmount] = useState<string>('5000');
  const [isSimulatingTransfer, setIsSimulatingTransfer] = useState<boolean>(false);

  // Card details
  const [cardNo, setCardNo] = useState<string>('');
  const [cardExpiry, setCardExpiry] = useState<string>('');
  const [cardCVV, setCardCVV] = useState<string>('');
  const [cardValue, setCardValue] = useState<string>('1500');
  const [isProcessingCard, setIsProcessingCard] = useState<boolean>(false);

  // Instant Paystack checkout modal sandbox states
  const [isPaystackOpen, setIsPaystackOpen] = useState<boolean>(false);
  const [paystackStep, setPaystackStep] = useState<'processing' | 'otp' | 'success'>('processing');
  const [paystackOtp, setPaystackOtp] = useState<string>('');
  const [paystackTxRef, setPaystackTxRef] = useState<string>('');

  // USSD code triggers
  const bankUSSDs = [
    { name: 'Access Bank', code: '*901#' },
    { name: 'GTBank (Guarantee Trust)', code: '*737#' },
    { name: 'Zenith Bank', code: '*966#' },
    { name: 'United Bank for Africa (UBA)', code: '*919#' },
    { name: 'Sterling Bank', code: '*822#' },
    { name: 'OPay MFB', code: '*955#' },
  ];

  // Withdrawal States
  const bankList = ['GTBank', 'Access Bank', 'Zenith Bank', 'UBA', 'Wema Bank', 'OPay', 'PalmPay', 'MoniePoint'];
  const [selectedBank, setSelectedBank] = useState<string>('GTBank');
  const [destAccount, setDestAccount] = useState<string>('');
  const [destAmount, setDestAmount] = useState<string>('');
  const [isResolvingAccount, setIsResolvingAccount] = useState<boolean>(false);
  const [resolvedAccountName, setResolvedAccountName] = useState<string>('');

  const [copiedAccount, setCopiedAccount] = useState<boolean>(false);

  // Derived Account Number for Virtual Account: 9 + User's phone minus leading zero
  const last9Digits = user.phone.startsWith('0') ? user.phone.substring(1) : user.phone;
  const virtualAccountNum = `9${last9Digits}`;

  const handleCopyAccount = () => {
    navigator.clipboard.writeText(virtualAccountNum);
    setCopiedAccount(true);
    addToast('Virtual account number copied successfully!', 'success');
    setTimeout(() => setCopiedAccount(false), 2000);
  };

  const handleTriggerMockTransfer = () => {
    const amt = parseFloat(fundingAmount) || 0;
    if (amt <= 50) {
      addToast('Minimum funding amount is ₦100.', 'error');
      return;
    }

    setIsSimulatingTransfer(true);
    addToast('Connecting sandbox node...', 'info');

    setTimeout(() => {
      setIsSimulatingTransfer(false);
      const generatedRef = `TN-DEP-${Math.floor(10000000 + Math.random() * 89999999)}`;
      onFundWallet(
        amt, 
        `Funded +₦${amt.toLocaleString()} via Instant Bank Transfer`, 
        'bank_transfer_sim', 
        generatedRef
      );
      addToast(`Simulated credit of ₦${amt.toLocaleString()} received instantly!`, 'success');
    }, 1800);
  };

  const handleTriggerCardFund = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(cardValue) || 0;

    if (cardNo.replace(/\s/g, '').length < 16) {
      addToast('Please enter a valid 16-digit credit/debit card number.', 'error');
      return;
    }

    if (amt < 100 || amt > 100000) {
      addToast('Card funding values must be between ₦100 and ₦100,000.', 'error');
      return;
    }

    setIsProcessingCard(true);
    addToast('Contacting Paystack gateway secure APIs...', 'info');

    setTimeout(() => {
      setIsProcessingCard(false);
      // Initialize interactive Paystack checkout simulation modal
      const generatedRef = `TN-DEP-${Math.floor(10000000 + Math.random() * 89999999)}`;
      setPaystackTxRef(generatedRef);
      setPaystackStep('processing');
      setIsPaystackOpen(true);

      // Transition to OTP verification stage
      setTimeout(() => {
        setPaystackStep('otp');
      }, 1605);
    }, 1300);
  };

  const handlePaystackCheckout = async (e: React.MouseEvent) => {
    e.preventDefault();
    const amt = parseFloat(cardValue) || 0;
    if (amt < 100 || amt > 100000) {
      addToast('Card funding values must be between ₦100 and ₦100,000.', 'error');
      return;
    }

    setIsProcessingCard(true);
    addToast('Connecting to Paystack checkout gateway...', 'info');

    const loaded = await loadPaystackScript();
    if (!loaded) {
      setIsProcessingCard(false);
      addToast('Gateway connection error: Could not load Paystack Inline JS script.', 'error');
      return;
    }

    const pKey = (import.meta as any).env.VITE_PAYSTACK_PUBLIC_KEY || 'pk_test_c962bda7bcde1bbf9fd6f801646271a067e2da5b';

    try {
      const handler = (window as any).PaystackPop.setup({
        key: pKey,
        email: user.email,
        amount: Math.round(amt * 100),
        currency: 'NGN',
        ref: `TN-PAY-${Date.now()}-${Math.floor(10000 + Math.random() * 90000)}`,
        callback: (response: any) => {
          setIsProcessingCard(false);
          onFundWallet(
            amt, 
            `Card funded +₦${amt.toLocaleString()} (Gateway: Paystack Inline)`, 
            'paystack', 
            response.reference
          );
          addToast(`Success! ₦${amt.toLocaleString()} securely credited via Paystack.`, 'success');
        },
        onClose: () => {
          setIsProcessingCard(false);
          addToast('Paystack payment checkout cancelled.', 'info');
        }
      });
      handler.openIframe();
    } catch (err: any) {
      setIsProcessingCard(false);
      console.error('Paystack failed to load:', err);
      addToast('Unexpected error during Paystack Popup initialization.', 'error');
    }
  };

  const handlePaystackOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (paystackOtp.length < 4) {
      addToast('Please enter the 4-digit security code sent to your phone.', 'error');
      return;
    }

    setPaystackStep('processing');
    addToast('Validating pin authorization with debit network switch...', 'info');

    setTimeout(() => {
      setPaystackStep('success');
      const amt = parseFloat(cardValue) || 1500;
      onFundWallet(
        amt, 
        `Card funded +₦${amt.toLocaleString()} (Gateway: Paystack Card Switch)`, 
        'paystack_sim', 
        paystackTxRef
      );
      addToast(`Payment successful! ₦${amt.toLocaleString()} securely loaded to wallet balance.`, 'success');

      setTimeout(() => {
        setIsPaystackOpen(false);
        setCardNo('');
        setCardExpiry('');
        setCardCVV('');
        setPaystackOtp('');
      }, 1600);
    }, 1800);
  };

  const handleFormatCardNo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const spaces = rawVal.match(/.{1,4}/g);
    if (spaces) {
      setCardNo(spaces.join(' '));
    } else {
      setCardNo(rawVal);
    }
  };

  const handleFormatExpiry = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal.length <= 4) {
      if (rawVal.length >= 3) {
        setCardExpiry(`${rawVal.substring(0, 2)}/${rawVal.substring(2)}`);
      } else {
        setCardExpiry(rawVal);
      }
    }
  };

  const handleResolveWithdrawalAccount = () => {
    if (destAccount.length < 10) {
      addToast('Please put a 10-digit NUBAN Nigerian account number.', 'error');
      return;
    }

    setIsResolvingAccount(true);
    setResolvedAccountName('');

    setTimeout(() => {
      setIsResolvingAccount(false);
      const randName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      setResolvedAccountName(randName);
      addToast('Bank account resolved successfully!', 'success');
    }, 1100);
  };

  const handleWithdrawSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(destAmount) || 0;
    const flatFee = 25; // ₦25 flat bank transfer fee in Nigeria

    if (!resolvedAccountName) {
      addToast('Please resolve the destination account name first.', 'error');
      return;
    }

    if (amt < 500) {
      addToast('Minimum withdrawal value is ₦500.', 'error');
      return;
    }

    const totalDeduction = amt + flatFee;

    if (user.walletBalance < totalDeduction) {
      addToast(`Insufficient funds. Your total debt is ₦${totalDeduction.toLocaleString()} (Amount ₦${amt.toLocaleString()} + Transfer Fee ₦${flatFee}) but your wallet has ₦${user.walletBalance.toLocaleString()}`, 'error');
      return;
    }

    onWithdrawWallet(
      amt, 
      flatFee, 
      `Withdrawal transfer -₦${amt.toLocaleString()} to ${selectedBank} (A/C: ${destAccount})`, 
      {
        bankName: selectedBank,
        accountNumber: destAccount,
        resolvedName: resolvedAccountName,
      }
    );
  };

  return (
    <div className="flex flex-col gap-6" id="wallet-funds-portal">
      {/* Upper toggle tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex max-w-md w-full">
        <button
          id="wallet-tab-fund"
          onClick={() => setActiveTab('fund')}
          className={`flex-1 py-3 text-sm font-bold font-display rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'fund' 
              ? 'bg-white text-slate-950 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
          Deposit (Fund Wallet)
        </button>
        <button
          id="wallet-tab-withdraw"
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-3 text-sm font-bold font-display rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'withdraw' 
              ? 'bg-white text-slate-950 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 text-emerald-500" />
          Withdrawal (Send Out)
        </button>
      </div>

      {activeTab === 'fund' ? (
        /* ================= DEPOSIT SCREEN ================= */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="deposit-sub-view">
          {/* Methods select left sidebar */}
          <div className="flex flex-col gap-2.5">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display mb-1">
              Funding Options
            </h3>
            <button
              id="method-transfer-btn"
              onClick={() => setFundMethod('transfer')}
              className={`p-4 border text-left rounded-2xl flex items-center gap-3 transition-all ${
                fundMethod === 'transfer'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <Building2 className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold font-display text-slate-800">Dynamic Bank Account</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Auto-credit transfer sandboxed</span>
              </div>
            </button>

            <button
              id="method-card-btn"
              onClick={() => setFundMethod('card')}
              className={`p-4 border text-left rounded-2xl flex items-center gap-3 transition-all ${
                fundMethod === 'card'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="p-2 bg-rose-50 rounded-lg text-rose-500">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="flex flex-col flex-grow">
                <span className="text-xs font-bold font-display text-slate-800">Card Payment (3D Secure)</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Paystack/Flutterwave gateway simulation</span>
              </div>
            </button>

            <button
              id="method-ussd-btn"
              onClick={() => setFundMethod('ussd')}
              className={`p-4 border text-left rounded-2xl flex items-center gap-3 transition-all ${
                fundMethod === 'ussd'
                  ? 'border-emerald-500 bg-emerald-50/50 shadow-sm'
                  : 'border-slate-100 bg-white hover:bg-slate-50'
              }`}
            >
              <div className="p-2 bg-amber-50 rounded-lg text-amber-500">
                <Smartphone className="w-4 h-4" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-bold font-display text-slate-800">USSD Codes Manual</span>
                <span className="text-[10px] text-slate-400 mt-0.5">Quick codes for offline reloads</span>
              </div>
            </button>
          </div>

          {/* Methods detailed views */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
            {fundMethod === 'transfer' && (
              <div className="flex flex-col gap-6" id="transfer-funding-card">
                <div>
                  <h3 className="font-display font-black text-slate-800 text-sm">Dynamic Virtual Bank Accounts</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Any electronic bank transfers triggered here credit your wallet index immediately.</p>
                </div>

                <div className="p-5 bg-slate-900 text-white rounded-2xl relative overflow-hidden group">
                  <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/5 rounded-full blur-xl" />
                  
                  <div className="border-b border-white/5 pb-4 mb-4 flex justify-between items-center text-xs">
                    <span className="font-display font-bold text-slate-300">🏢 REGISTERED PAYMENT LINK AGREEMENT</span>
                    <span className="text-[10px] bg-emerald-500 text-white px-2 py-0.5 rounded-full font-bold">ACTIVE</span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-display">DESIGNATED BANKEE:</span>
                      <span className="text-sm font-bold font-display text-white">Wema Bank (Wavie)</span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 uppercase block font-display">ACCOUNT TITLE / NAME:</span>
                      <span className="text-sm font-bold font-display text-white uppercase">{user.name || 'WAVIE DEVELOPER'}</span>
                    </div>

                    <div className="md:col-span-2 border-t border-white/5 pt-3 mt-1 flex justify-between items-center bg-white/5 p-3 rounded-xl backdrop-blur-sm">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-slate-400 w-56 truncate font-mono">DURABLE VIRTUAL LEDGER ACCOUNT NO (10 digits):</span>
                        <span className="text-2xl font-black font-mono text-white tracking-widest mt-1">
                          {virtualAccountNum}
                        </span>
                      </div>
                      <button
                        id="copy-virtual-acc-btn"
                        onClick={handleCopyAccount}
                        className="py-2.5 px-4 bg-white text-emerald-950 hover:bg-slate-100 shadow-sm hover:shadow-md rounded-xl text-xs font-bold font-display flex items-center gap-1.5 transition-all active:scale-95"
                      >
                        <Copy className="w-3.5 h-3.5" />
                        {copiedAccount ? 'Copied' : 'Copy Acc'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Simulated Bank funding sandbox */}
                <div className="p-5 border border-dashed border-slate-200 bg-slate-50 rounded-2xl flex flex-col gap-4">
                  <span className="text-xs font-bold text-emerald-900 flex items-center gap-1">
                    <Smartphone className="w-4 h-4 text-emerald-600" />
                    Sandbox Financial Node (Direct simulation)
                  </span>

                  <div className="flex flex-col md:flex-row gap-3">
                    <div className="flex-grow">
                      <label className="text-[10px] font-bold text-slate-400 block mb-1">AMOUT TO TRANSFER (₦)</label>
                      <input
                        id="simulation-amount-input"
                        type="number"
                        placeholder="₦5,000"
                        value={fundingAmount}
                        onChange={(e) => setFundingAmount(e.target.value)}
                        className="w-full p-2.5 border border-slate-200 bg-white rounded-xl text-base font-bold outline-none font-display focus:border-emerald-500"
                      />
                    </div>

                    <button
                      id="simulate-transfer-trigger-btn"
                      type="button"
                      onClick={handleTriggerMockTransfer}
                      disabled={isSimulatingTransfer}
                      className="py-2.5 px-6 self-end bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold font-display rounded-xl transition-all shadow-md active:scale-95 disabled:bg-slate-300 flex items-center justify-center gap-1.5 h-[45px] w-full md:w-auto"
                    >
                      {isSimulatingTransfer ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          Crediting...
                        </>
                      ) : (
                        <>
                          <ArrowDownLeft className="w-4 h-4" />
                          Simulate +₦{(parseFloat(fundingAmount) || 0).toLocaleString()} Bank Credit
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {fundMethod === 'card' && (
              <form onSubmit={handleTriggerCardFund} className="flex flex-col gap-4" id="card-funding-form">
                <div>
                  <h3 className="font-display font-black text-slate-850 text-sm">Online Gateway Credit Placement</h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">Debit card recharges deliver credit and cashbacks immediately.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display">CARHOLDER DEBIT PAN (16 digits)</label>
                    <div className="relative">
                      <input
                        id="payment-card-pan-input"
                        type="text"
                        placeholder="4321 0000 0000 0000"
                        value={cardNo}
                        onChange={handleFormatCardNo}
                        maxLength={19} // 16 digits + 3 spaces
                        className="w-full p-3 pl-11 border border-slate-205 rounded-xl text-base font-mono font-bold tracking-widest bg-slate-50 focus:bg-white focus:border-emerald-500 outline-none shadow-inner"
                        required
                      />
                      <CreditCard className="absolute left-3.5 top-4.5 w-4 h-4 text-slate-450" />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Expiration (MM/YY)</label>
                    <input
                      id="payment-card-exp-input"
                      type="text"
                      placeholder="12/28"
                      value={cardExpiry}
                      onChange={handleFormatExpiry}
                      maxLength={5}
                      className="w-full p-3 border border-slate-205 rounded-xl text-sm font-mono text-center font-bold tracking-widest bg-slate-50 focus:bg-white outline-none"
                      required
                    />
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Security CVV (3 digits)</label>
                    <input
                      id="payment-card-cvv-input"
                      type="password"
                      placeholder="•••"
                      value={cardCVV}
                      onChange={(e) => setCardCVV(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={3}
                      className="w-full p-3 border border-slate-205 rounded-xl text-sm font-mono text-center font-bold tracking-widest bg-slate-50 focus:bg-white outline-none"
                      required
                    />
                  </div>

                  <div className="md:col-span-2 flex flex-col gap-1.5">
                    <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Payment Amount (₦)</label>
                    <input
                      id="payment-card-amount-input"
                      type="number"
                      placeholder="N1,500"
                      min={100}
                      max={100000}
                      value={cardValue}
                      onChange={(e) => setCardValue(e.target.value)}
                      className="w-full p-4.5 border border-slate-205 rounded-xl text-lg font-black tracking-tight bg-slate-50 focus:bg-white outline-none font-display focus:border-emerald-500"
                      required
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-3 mt-4">
                  {/* Real Paystack Popup Button */}
                  <button
                    id="real-paystack-popup-btn"
                    type="button"
                    onClick={handlePaystackCheckout}
                    disabled={isProcessingCard}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-450 text-slate-950 rounded-xl text-xs font-bold font-display uppercase tracking-wider transition-all active:scale-95 disabled:opacity-50 shadow-md hover:shadow-lg flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isProcessingCard ? (
                      <>
                        <Loader2 className="w-4.5 h-4.5 animate-spin text-slate-950" />
                        Connecting to Paystack gateway...
                      </>
                    ) : (
                      <>
                        <ShieldCheck className="w-4.5 h-4.5 text-slate-950 animate-pulse" />
                        Pay with Paystack (Real Popup Gateway)
                      </>
                    )}
                  </button>

                  {/* Manual Sim Button */}
                  <button
                    id="card-fund-submit-btn"
                    type="submit"
                    disabled={isProcessingCard}
                    className="w-full py-3.5 bg-slate-900 border border-slate-950 hover:bg-black text-white rounded-xl text-xs font-bold font-display transition-all active:scale-95 disabled:bg-slate-350 shadow shadow-md hover:shadow-lg flex items-center justify-center gap-1.5"
                  >
                    {isProcessingCard ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                        Authenticating card payload...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 text-emerald-400 animate-pulse" />
                        Simulate Card Charge of ₦{(parseFloat(cardValue) || 0).toLocaleString()} (Offline)
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}

            {fundMethod === 'ussd' && (
              <div className="flex flex-col gap-6" id="ussd-funding-board">
                <div>
                  <h3 className="font-display font-black text-slate-850 text-sm font-display">USSD Codes Quick Reference</h3>
                  <p className="text-[11px] text-slate-430 leading-relaxed font-semibold">Copy and dial corresponding bank codes from your registered SIM line to complete manual funding transactions directly.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-1">
                  {bankUSSDs.map((ussd) => (
                    <div key={ussd.name} className="p-3 border border-slate-100 rounded-xl flex items-center justify-between text-xs bg-slate-50/50">
                      <span className="font-bold text-slate-700 font-display">{ussd.name}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono font-bold text-emerald-700 tracking-wider font-bold">{ussd.code}</span>
                        <button
                          id={`copy-ussd-${ussd.name.replace(/\s/g, '-')}`}
                          onClick={() => {
                            navigator.clipboard.writeText(ussd.code);
                            addToast(`Copied USSD ${ussd.code} code.`, 'success');
                          }}
                          className="p-1 hover:bg-slate-200 text-slate-400 hover:text-slate-700 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* ================= WITHDRAWAL SCREEN ================= */
        <form onSubmit={handleWithdrawSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="withdraw-sub-view">
          {/* Instructions card on left */}
          <div className="bg-slate-900 text-white rounded-2xl p-5 flex flex-col gap-4">
            <div className="p-2.5 bg-white/10 rounded-xl max-w-max text-emerald-400">
              <ShieldCheck className="w-5 h-5 animate-bounce" />
            </div>

            <div>
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-white mb-1.5 leading-snug">
                NUBAN Cash-Out policy
              </h4>
              <p className="text-[11px] text-slate-350 leading-relaxed font-semibold">
                Centralized gateway routers require validating destination recipient banks to suppress fraud. Flat transfer service rate surcharges of ₦25 apply to each transactional draw.
              </p>
            </div>

            <div className="text-[10px] text-slate-400 font-mono flex flex-col gap-1 border-t border-white/5 pt-3">
              <span>🛡️ Limits mapped on KYC status</span>
              <span>⚡ Auto-completion within 3-8 seconds</span>
              <span>🔒 4-Digit Security Authorization required</span>
            </div>
          </div>

          {/* Form area list */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-101 shadow-sm p-6 flex flex-col gap-6">
            <div>
              <h3 className="font-display font-black text-slate-800 text-sm">Bank Transfer Reseller Outflow</h3>
              <p className="text-[11px] text-slate-400 mt-0.5 font-semibold">Withdraw credit holdings back into any commercial account.</p>
            </div>

            {/* Recipient Bank selector */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Target Bank</label>
              <select
                id="withdrawal-target-bank"
                value={selectedBank}
                onChange={(e) => {
                  setSelectedBank(e.target.value);
                  setResolvedAccountName('');
                }}
                className="w-full p-3 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold font-display outline-none text-slate-700"
              >
                {bankList.map((bk) => (
                  <option key={bk} value={bk}>{bk}</option>
                ))}
              </select>
            </div>

            {/* NUBAN Input & account resolver */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                NUBAN Account Number (10 digits)
              </label>
              <div className="flex gap-2">
                <input
                  id="withdrawal-account-number"
                  type="text"
                  placeholder="0012345678"
                  value={destAccount}
                  onChange={(e) => {
                    setDestAccount(e.target.value.replace(/[^0-9]/g, ''));
                    setResolvedAccountName('');
                  }}
                  maxLength={10}
                  className="flex-grow p-3.5 bg-slate-50 border border-slate-205 rounded-xl font-mono text-base font-black tracking-widest focus:bg-white outline-none"
                  required
                />
                
                <button
                  id="resolve-withdrawal-acc-btn"
                  type="button"
                  onClick={handleResolveWithdrawalAccount}
                  disabled={isResolvingAccount}
                  className="px-4 bg-slate-900 text-white rounded-xl text-xs font-bold font-display hover:bg-black transition-colors flex items-center justify-center gap-1.5 h-[48px]"
                >
                  {isResolvingAccount ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <UserCheck className="w-3.5 h-3.5" />
                  )}
                  Resolve Beneficiary
                </button>
              </div>
            </div>

            {/* Resolved user feedback */}
            {resolvedAccountName && (
              <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl text-xs flex flex-col gap-0.5" id="resolved-withdrawal-box">
                <span className="text-[9px] font-black tracking-wiest uppercase text-emerald-805 block">RESOLVED BEN MEMBER:</span>
                <span className="text-xs font-bold font-display text-slate-800 uppercase block select-all">{resolvedAccountName}</span>
              </div>
            )}

            {/* Amount and fee calculation */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-401 uppercase tracking-wider font-display">Amount to Transfer (₦)</label>
                <input
                  id="withdrawal-amount-input"
                  type="number"
                  placeholder="Min N500"
                  min={500}
                  value={destAmount}
                  onChange={(e) => setDestAmount(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-205 focus:bg-white rounded-xl text-base font-black tracking-tight font-display focus:border-emerald-500 outline-none"
                  required
                />
              </div>

              {/* Fee and breakdown guide widget */}
              <div className="p-4 bg-slate-50 border border-slate-105 rounded-xl flex flex-col justify-center text-xs font-medium font-display leading-normal text-slate-700 shadow-inner">
                <div className="flex justify-between">
                  <span className="text-slate-400">Transfer Out Amount:</span>
                  <span className="font-bold">₦{(parseFloat(destAmount) || 0).toLocaleString()}</span>
                </div>
                <div className="flex justify-between border-b border-slate-150 pb-1.5 mb-1.5 mt-0.5">
                  <span className="text-slate-405">Processor Flat Fee:</span>
                  <span className="font-bold text-amber-600">+₦25</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 text-[10px] uppercase font-bold tracking-wider">TOTAL INVOICE DEBT:</span>
                  <span className="text-base font-extrabold text-slate-900 font-display">
                    ₦{(destAmount ? parseFloat(destAmount) + 25 : 0).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            {/* Form submit withdraw button */}
            <button
              id="withdrawal-submit-btn"
              type="submit"
              className="w-full py-4 text-white font-bold font-display rounded-xl bg-slate-900 border border-slate-950 text-sm hover:bg-black transition-all shadow-md active:scale-95 flex items-center justify-center gap-2"
            >
              <ArrowUpRight className="w-4 h-4 text-emerald-400" />
              Transfer ₦{destAmount ? (parseFloat(destAmount) + 25).toLocaleString() : '0'} Back to external account
            </button>
          </div>
        </form>
      )}

      {/* Paystack Interactive Checkout Sandbox Modal Overlay */}
      <AnimatePresence>
        {isPaystackOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm">
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-white rounded-3xl shadow-2xl overflow-hidden w-full max-w-md border border-slate-100 flex flex-col"
            >
              {/* Paystack distinctive brand header */}
              <div className="bg-[#09a5db] text-white p-6 flex flex-col gap-1 relative">
                <button 
                  type="button"
                  onClick={() => setIsPaystackOpen(false)}
                  className="absolute right-4 top-4 text-white/80 hover:text-white font-bold p-1 hover:bg-white/10 rounded-full w-8 h-8 flex items-center justify-center text-sm cursor-pointer"
                >
                  ✕
                </button>
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-white/20 rounded-lg">
                    <CreditCard className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <span className="font-sans font-black tracking-wider text-xs uppercase opacity-90">PAYSTACK SECURE SWITCH</span>
                </div>
                <div className="mt-4">
                  <span className="text-[10px] text-white/70 block uppercase">Paying customer</span>
                  <span className="text-sm font-semibold font-mono tracking-tight">{user.email}</span>
                </div>
              </div>

              {/* Body */}
              <div className="p-6 flex flex-col gap-6">
                {paystackStep === 'processing' && (
                  <div className="flex flex-col items-center justify-center py-8 gap-4">
                    <Loader2 className="w-12 h-12 text-[#0a2f4c] animate-spin" />
                    <div className="text-center">
                      <p className="font-semibold text-slate-800 text-sm">Validating payment instructions</p>
                      <p className="text-xs text-slate-400 mt-1 font-medium">Communicating with the secure bank authorization server...</p>
                    </div>
                  </div>
                )}

                {paystackStep === 'otp' && (
                  <form onSubmit={handlePaystackOtpSubmit} className="flex flex-col gap-5">
                    <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3 text-amber-900 leading-normal">
                      <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 self-center" />
                      <div className="flex flex-col">
                        <span className="text-xs font-bold font-display">3D Secure Sandbox Gate</span>
                        <span className="text-[10px] text-amber-800 font-medium mt-0.5">Please authorize the debit charge of ₦{(parseFloat(cardValue) || 1500).toLocaleString()} using the standard mock bank passcode details.</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 align-middle text-center">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-widest font-display">ENTER 4-DIGIT TRANSACTION AUTH CODE</label>
                      <input 
                        type="password"
                        placeholder="••••"
                        value={paystackOtp}
                        onChange={(e) => setPaystackOtp(e.target.value.replace(/[^0-9]/g, ''))}
                        maxLength={4}
                        className="p-3 border-2 border-slate-200 focus:border-[#09a5db] text-center font-mono font-bold tracking-[2em] text-2xl w-48 mx-auto rounded-xl outline-none"
                        required
                        autoFocus
                      />
                      <span className="text-[10px] text-slate-400 mt-1 font-medium">A mockup verification PIN has been triggered to your active phone lines. Type any 4 digits to proceed.</span>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-4 bg-[#3cbf80] hover:bg-[#2fa067] text-white font-bold font-display rounded-xl text-xs tracking-wider uppercase transition-all shadow-md active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Lock className="w-4 h-4 text-white" />
                      Authorize & Charge ₦{(parseFloat(cardValue) || 1500).toLocaleString()}
                    </button>
                  </form>
                )}

                {paystackStep === 'success' && (
                  <div className="flex flex-col items-center justify-center py-6 gap-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-full flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-200">
                      <Check className="w-7 h-7 stroke-[3px]" />
                    </div>
                    <div className="text-center">
                      <p className="font-extrabold text-slate-900 text-base">Payment Successful</p>
                      <p className="text-xs text-slate-450 mt-1 font-semibold">Ledger successfully credited with ₦{(parseFloat(cardValue) || 1500).toLocaleString()}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer secure tags */}
              <div className="border-t border-slate-100 bg-slate-50 px-6 py-4 flex items-center justify-between text-[10px] text-slate-400 font-bold font-sans">
                <span className="flex items-center gap-1 text-[#0a2f4c]">
                  <ShieldCheck className="w-4 h-4 text-[#3cbf80]" />
                  SECURED BY PAYSTACK
                </span>
                <span className="font-mono">REF: {paystackTxRef}</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Internal lock icon helper
const LockIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
  </svg>
);
