import React, { useEffect, useState } from 'react';
import { 
  Loader2, CheckCircle2, AlertCircle, ShieldCheck, 
  ArrowRight, Key, HelpCircle 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export type PaymentStatus = 'initializing' | 'authorizing' | 'verifying' | 'settlement' | 'success' | 'failed';

interface PaymentLoadingStateProps {
  isOpen: boolean;
  status: PaymentStatus;
  amount: number;
  reference: string;
  email: string;
  errorMessage?: string;
  onClose: () => void;
}

interface StepDetail {
  label: string;
  desc: string;
  status: 'pending' | 'active' | 'completed' | 'failed';
}

export const PaymentLoadingState: React.FC<PaymentLoadingStateProps> = ({
  isOpen,
  status,
  amount,
  reference,
  email,
  errorMessage,
  onClose
}) => {
  const [progress, setProgress] = useState(10);
  const [logs, setLogs] = useState<string[]>([]);

  // Calculate dynamic progress & logs depending on status
  useEffect(() => {
    if (!isOpen) return;

    let targetProgress = 10;
    const newLogs: string[] = [];

    switch (status) {
      case 'initializing':
        targetProgress = 25;
        newLogs.push('⚡ [PAYSTACK_INIT] Initializing secure payment session context...');
        newLogs.push('🌐 Exchanging handshake keys with secure.paystack.co API gateway...');
        break;
      case 'authorizing':
        targetProgress = 50;
        newLogs.push('✔ [PAYSTACK_INIT] Endpoint connected successfully.');
        newLogs.push('🔑 [3D_SECURE] Awaiting merchant authorization and card security challenge verification...');
        newLogs.push('📱 Please complete the authorization dialog popup...');
        break;
      case 'verifying':
        targetProgress = 75;
        newLogs.push('✔ [3D_SECURE] Passcode authorization code accepted.');
        newLogs.push('🔐 [SIGNATURE_CHECK] Exchanging cryptographic secure tokens...');
        newLogs.push('🛰 [BACKEND_VERIFY] Querying Paystack verification service layer...');
        break;
      case 'settlement':
        targetProgress = 90;
        newLogs.push('✔ [BACKEND_VERIFY] Paystack verification confirmed successfully!');
        newLogs.push('💾 [LOCAL_LEDGER] Crediting wallet balance and saving metadata snapshot...');
        newLogs.push('📊 Re-indexing recent transactions database structures...');
        break;
      case 'success':
        targetProgress = 100;
        newLogs.push('✔ [LOCAL_LEDGER] Wallet balance incremented + credit logged.');
        newLogs.push('🎉 [SUCCESS] Payment process finished perfectly!');
        break;
      case 'failed':
        targetProgress = 100;
        newLogs.push('❌ [ERROR] Payment process aborted or cancelled.');
        if (errorMessage) {
          newLogs.push(`⚠️ Details: ${errorMessage}`);
        }
        break;
    }

    // Set logs
    setLogs(newLogs);

    // Smooth progress bar incrementing
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev < targetProgress) return prev + 1;
        if (prev > targetProgress) return prev - 1;
        return prev;
      });
    }, 20);

    return () => clearInterval(interval);
  }, [status, isOpen, errorMessage]);

  if (!isOpen) return null;

  // Render steps tracking
  const steps: StepDetail[] = [
    { 
      label: 'Secure Handshake', 
      desc: 'Connect with payment gateway APIs',
      status: status === 'initializing' ? 'active' : status === 'failed' && progress < 40 ? 'failed' : progress > 30 ? 'completed' : 'pending'
    },
    { 
      label: 'Authentication Switch', 
      desc: 'Verify credit card passcode security',
      status: status === 'authorizing' ? 'active' : status === 'failed' && progress >= 40 && progress < 70 ? 'failed' : progress > 60 ? 'completed' : 'pending'
    },
    { 
      label: 'Ledger Audit & Credit', 
      desc: 'Execute real-time wallet settlement',
      status: (status === 'verifying' || status === 'settlement') ? 'active' : status === 'failed' && progress >= 75 ? 'failed' : status === 'success' ? 'completed' : 'pending'
    }
  ];

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-[9999] overflow-y-auto"
        id="payment-loading-screen-modal"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.93, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -10 }}
          transition={{ type: 'spring', damping: 25, stiffness: 350 }}
          className="bg-white rounded-3xl border border-slate-105 shadow-[0_32px_96px_-12px_rgba(15,23,42,0.18)] max-w-lg w-full overflow-hidden flex flex-col"
        >
          {/* Header styling */}
          <div className="bg-slate-950 px-6 py-5 border-b border-white/[0.04] text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 bg-emerald-500/15 rounded-xl border border-emerald-500/20">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-emerald-400 tracking-widest uppercase">Safe Gateway Connect</span>
                <span className="text-xs font-black tracking-wide text-slate-200">PAYSTACK TRUST ENGINE</span>
              </div>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-[9px] text-slate-400 font-bold uppercase">Funding Target</span>
              <span className="text-xs font-black font-mono text-emerald-400">₦{amount.toLocaleString()}</span>
            </div>
          </div>

          {/* Interactive Progress Ring & Info Box */}
          <div className="p-6 md:p-8 flex flex-col items-center border-b border-slate-50 gap-6">
            <div className="relative w-28 h-28 flex items-center justify-center">
              {/* SVG Circle Progress */}
              <svg className="absolute -rotate-90 w-28 h-28">
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  className="stroke-slate-100 fill-none" 
                  strokeWidth="8"
                />
                <circle 
                  cx="56" 
                  cy="56" 
                  r="48" 
                  className={`fill-none transition-all duration-300 ease-out ${
                    status === 'failed' ? 'stroke-rose-500' : 'stroke-emerald-500'
                  }`} 
                  strokeWidth="8"
                  strokeDasharray={`${2 * Math.PI * 48}`}
                  strokeDashoffset={`${2 * Math.PI * 48 * (1 - progress / 100)}`}
                  strokeLinecap="round"
                />
              </svg>

              {/* Inner Status Icon */}
              <div className="flex flex-col items-center justify-center">
                {status === 'success' ? (
                  <CheckCircle2 className="w-10 h-10 text-emerald-500 animate-bounce" />
                ) : status === 'failed' ? (
                  <AlertCircle className="w-10 h-10 text-rose-500 animate-pulse" />
                ) : (
                  <span className="text-xl font-extrabold text-slate-800 font-mono">{progress}%</span>
                )}
                <span className="text-[9px] font-bold text-slate-400 uppercase mt-1 tracking-wider">
                  {status === 'success' ? 'Settled' : status === 'failed' ? 'Aborted' : 'Syncing'}
                </span>
              </div>
            </div>

            <div className="text-center flex flex-col gap-1 w-full max-w-sm">
              <h4 className="font-display font-black text-slate-900 text-sm tracking-wide uppercase">
                {status === 'initializing' && 'Preparing Gateway Interface...'}
                {status === 'authorizing' && 'Awaiting Secure OTP Authorization...'}
                {status === 'verifying' && 'Exchanging Gateway Certificates...'}
                {status === 'settlement' && 'Settling Wallet Balance Ledger...'}
                {status === 'success' && 'Deposit Process Completed!'}
                {status === 'failed' && 'Transaction Processing Failed'}
              </h4>
              <p className="text-[11px] font-sans font-medium text-slate-450 leading-relaxed">
                {status === 'initializing' && 'Exchanging cryptographic tokens with central payment switches.'}
                {status === 'authorizing' && 'Please fill out the standard Paystack inline popups or card PIN dialogue fields.'}
                {status === 'verifying' && 'Querying backend gateway nodes to authenticate payment signatures.'}
                {status === 'settlement' && 'Updating user database profile securely; logging transaction receipts.'}
                {status === 'success' && 'Your funds have been deposited successfully into your local wallet ledger.'}
                {status === 'failed' && (errorMessage || 'We were unable to complete the transaction verify request.')}
              </p>
            </div>
          </div>

          {/* Stepper block list */}
          <div className="px-6 py-4.5 bg-slate-50 flex flex-col gap-3.5 border-b border-slate-100">
            <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest font-display block">System Milestone Indicators</span>
            <div className="flex flex-col gap-2.5">
              {steps.map((st, i) => (
                <div 
                  key={i}
                  className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                    st.status === 'active' 
                      ? 'bg-slate-905 border-slate-900 shadow-sm text-slate-900' 
                      : st.status === 'completed'
                      ? 'bg-emerald-50/55 border-emerald-100 text-slate-700'
                      : st.status === 'failed'
                      ? 'bg-rose-50/55 border-rose-100 text-slate-700'
                      : 'bg-white opacity-45 border-slate-150 text-slate-400'
                  }`}
                >
                  <div className="mt-0.5">
                    {st.status === 'completed' && (
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    )}
                    {st.status === 'failed' && (
                      <AlertCircle className="w-4 h-4 text-rose-550" />
                    )}
                    {st.status === 'active' && (
                      <Loader2 className="w-4 h-4 text-slate-900 animate-spin" />
                    )}
                    {st.status === 'pending' && (
                      <div className="w-4 h-4 rounded-full border border-slate-300 flex items-center justify-center text-[8px] font-bold">
                        {i + 1}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[10px] font-black tracking-wide font-display uppercase">{st.label}</span>
                    <span className="text-[9px] opacity-80 mt-0.5">{st.desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Micro-terminal background logs */}
          <div className="p-4 bg-slate-950 font-mono text-[9px] text-slate-400 flex flex-col gap-1 uppercase tracking-wide min-h-[90px] max-h-[120px] overflow-y-auto">
            <div className="text-white/60 font-bold border-b border-white/5 pb-1 flex justify-between items-center mb-1">
              <span>SYSTEM SHELL HANDSHAKE LOGS</span>
              <span className="text-[8px] px-1.5 py-0.5 bg-white/10 rounded tracking-wider">REF: {reference}</span>
            </div>
            {logs.map((lg, i) => (
              <div key={i} className={lg.includes('❌') || lg.includes('⚠️') ? 'text-rose-400' : lg.includes('✔') ? 'text-emerald-400' : 'text-slate-350'}>
                {lg}
              </div>
            ))}
          </div>

          {/* Action Footer if complete or failed */}
          {(status === 'success' || status === 'failed') && (
            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={onClose}
                className={`px-5 py-2.5 text-xs font-black font-display tracking-widest uppercase rounded-xl flex items-center gap-1.5 cursor-pointer active:scale-95 transition-all ${
                  status === 'success' 
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md'
                    : 'bg-slate-900 hover:bg-black text-white shadow-md'
                }`}
              >
                Continue to Dashboard
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
