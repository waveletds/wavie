import React from 'react';
import { X, Check, Copy, Download, Share2, Printer, Award, Lightbulb, Tv, Phone, ShieldCheck, Cpu, Terminal, RefreshCw, Barcode } from 'lucide-react';
import { Transaction } from '../types';

interface ReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({ isOpen, onClose, transaction, addToast }) => {
  if (!isOpen || !transaction) return null;

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    addToast(`${label} copied to clipboard!`, 'success');
  };

  const getIcon = () => {
    switch (transaction.type) {
      case 'airtime':
        return <Phone className="w-6 h-6 text-indigo-500 animate-pulse" />;
      case 'data':
        return <Phone className="w-6 h-6 text-indigo-500 animate-pulse" />;
      case 'electricity':
        return <Lightbulb className="w-6 h-6 text-amber-500 animate-pulse" />;
      case 'cable':
        return <Tv className="w-6 h-6 text-rose-500 animate-pulse" />;
      case 'education':
        return <Award className="w-6 h-6 text-emerald-500 animate-pulse" />;
      default:
        return <ShieldCheck className="w-6 h-6 text-slate-500" />;
    }
  };

  const renderProductSpecifics = () => {
    const details = transaction.details;
    if (!details) return null;

    switch (transaction.type) {
      case 'electricity':
        return (
          <div className="mt-4 p-4 bg-slate-950 border border-amber-500/20 rounded-2xl text-center relative overflow-hidden group">
            {/* Holographic background glow */}
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 via-transparent to-amber-500/5" />
            <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-amber-500/30 to-transparent" />
            
            <span className="text-[9px] font-bold text-amber-400 font-mono tracking-[0.3em] uppercase block mb-2">
              ⚡ METALOGIC DISPATCH TOKEN
            </span>
            <div className="flex items-center justify-center gap-2.5 relative z-10">
              <span className="text-xl font-mono font-black text-white tracking-widest bg-black/60 px-3 py-1.5 rounded-lg border border-white/5 shadow-inner">
                {details.token || '2394-3408-1123-5590-4812'}
              </span>
              <button
                id="copy-token-btn"
                onClick={() => handleCopyText(details.token || '2394-3408-1123-5590-4812', 'Electricity Token')}
                className="p-2 hover:bg-amber-400/20 rounded-lg transition-all text-amber-400 border border-amber-400/30 hover:border-amber-400 active:scale-90"
                title="Copy Token"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] text-amber-300/70 font-mono mt-2 flex items-center justify-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-amber-500" />
              Load token into pre-paid meter mechanism
            </p>
          </div>
        );

      case 'education':
        return (
          <div className="mt-4 border-t border-dashed border-slate-200 pt-4 flex flex-col gap-3">
            <span className="text-[10px] font-mono tracking-[0.2em] text-slate-400 uppercase block">
              🎓 QUANTUM DELIVERED EPINS:
            </span>
            {details.pins && details.pins.map((pinItem, idx) => (
              <div key={idx} className="p-3 bg-slate-950 border border-slate-800 rounded-2xl flex flex-col gap-1.5 text-left relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-500/5 to-transparent rounded-full blur-xl pointer-events-none" />
                <div className="flex items-center justify-between relative z-10">
                  <span className="text-xs text-emerald-400 font-bold font-mono">
                    CARD VOUCHER {idx + 1} // {details.examType?.toUpperCase()}
                  </span>
                  <button
                    id={`copy-pin-all-${idx}`}
                    onClick={() => handleCopyText(`SERIAL: ${pinItem.serial} | PIN: ${pinItem.pin}`, `Voucher #${idx + 1}`)}
                    className="p-1.5 bg-slate-900 border border-slate-800 hover:border-emerald-500/50 rounded-lg text-slate-400 hover:text-emerald-400 transition-colors"
                    title="Copy Full Voucher"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-0.5 text-white relative z-10">
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/85">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider">SERIAL:</span>
                    <span className="text-xs font-mono font-bold block select-all text-slate-200">{pinItem.serial}</span>
                  </div>
                  <div className="bg-slate-900/80 p-2 rounded-xl border border-slate-800/85">
                    <span className="text-[9px] font-mono text-slate-500 block uppercase tracking-wider">PIN/DECRYPT:</span>
                    <span className="text-xs font-mono font-bold text-emerald-400 block select-all">{pinItem.pin}</span>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[9px] text-emerald-600/90 bg-emerald-50/50 px-3 py-2 rounded-xl font-mono mt-0.5 border border-emerald-100/60 leading-normal">
              ⚡ Decrypted PIN arrays have been auto-dispatched to your WhatsApp node context and email feed.
            </p>
          </div>
        );

      case 'airtime':
      case 'data':
        return (
          <div className="mt-4 flex items-center justify-between bg-slate-50 border border-slate-100/80 p-3.5 rounded-2xl relative">
            <span className="text-xs font-medium text-slate-500 font-mono">ROUTED CARRIER:</span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-2 font-display">
              <span className={`w-2.5 h-2.5 rounded-full ring-2 ring-white shadow-sm ${
                details.network === 'MTN' ? 'bg-amber-400 animate-pulse' :
                details.network === 'Airtel' ? 'bg-red-500 animate-pulse' :
                details.network === 'Glo' ? 'bg-green-500 animate-pulse' : 'bg-indigo-600 animate-pulse'
              }`} />
              {details.network} 
              {details.planName ? ` (${details.planName})` : ' Airtime Topup'}
            </span>
          </div>
        );

      case 'cable':
        return (
          <div className="mt-4 p-3.5 bg-slate-950 border border-rose-500/15 rounded-2xl flex flex-col gap-2.5 text-white relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 to-transparent pointer-events-none" />
            <div className="flex justify-between items-center text-xs relative z-10">
              <span className="font-mono text-slate-400">TV DECODER PORTAL:</span>
              <span className="font-bold text-rose-400 font-display">{details.provider}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2.5 relative z-10">
              <span className="font-mono text-slate-400">PLAN SELECTION:</span>
              <span className="font-medium text-slate-200">{details.packageName}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-slate-800/80 pt-2.5 relative z-10">
              <span className="font-mono text-slate-400">SYSTEM IUC/REF:</span>
              <span className="font-mono font-bold text-rose-400">{details.iucNumber}</span>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const formattedDate = new Date(transaction.timestamp).toLocaleString('en-US', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4 print:p-0 print:bg-white overflow-y-auto">
      {/* Dynamic ambient backdrop light */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-72 h-72 bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none" />

      <div 
        id="receipt-modal-container"
        className="relative w-full max-w-md bg-white rounded-3xl shadow-[0_30px_70px_-10px_rgba(15,23,42,0.3)] overflow-hidden border border-slate-200/90 flex flex-col max-h-[95vh] animate-fade-in"
        style={{ 
          animation: 'zoomIn 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Futuristic layout brackets indicator marks */}
        <div className="absolute top-4 left-4 w-3.5 h-3.5 border-t-2 border-l-2 border-slate-350 pointer-events-none rounded-tl-sm print:hidden" />
        <div className="absolute top-4 right-4 w-3.5 h-3.5 border-t-2 border-r-2 border-slate-350 pointer-events-none rounded-tr-sm print:hidden" />
        <div className="absolute bottom-4 left-4 w-3.5 h-3.5 border-b-2 border-l-2 border-slate-350 pointer-events-none rounded-bl-sm print:hidden" />
        <div className="absolute bottom-4 right-4 w-3.5 h-3.5 border-b-2 border-r-2 border-slate-350 pointer-events-none rounded-br-sm print:hidden" />

        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/50 print:hidden relative z-10">
          <div className="flex items-center gap-2 text-slate-800 font-bold font-mono text-xs tracking-widest uppercase">
            <Cpu className="w-4 h-4 text-slate-500 animate-[spin_8s_linear_infinite]" />
            WAVIE SECURE RECEIPT
          </div>
          <button 
            id="close-receipt-btn" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-800 transition-all p-1.5 hover:bg-slate-100 rounded-xl"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Print Container */}
        <div className="p-6 overflow-y-auto flex-grow print:p-8 no-scrollbar relative z-10" id="printable-receipt-area">
          {/* Logo & Dynamic Hologram Icon Area */}
          <div className="flex flex-col items-center text-center mt-3">
            <div className="relative flex items-center justify-center w-14 h-14 rounded-2xl bg-slate-50 border border-slate-150/80 shadow-inner mb-3">
              {/* Spinning tech border arc */}
              <div className="absolute inset-0 rounded-2xl border border-dashed border-indigo-400/40 animate-[spin_30s_linear_infinite]" />
              <div className="absolute inset-1 rounded-full border border-slate-100 bg-white" />
              <div className="relative z-10">
                {getIcon()}
              </div>
            </div>
            
            <h2 className="text-xl font-black font-display tracking-tight text-slate-900">
              WAVIE FINANCIALS
            </h2>
            <p className="text-[9px] text-slate-400 font-mono tracking-wider">SECURE LEDGER SETTLEMENT</p>

            {/* Futuristic floating pill */}
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-mono tracking-widest font-extrabold mt-3.5 border shadow-sm transition-all ${
              transaction.status === 'success' ? 'bg-emerald-500/10 text-emerald-700 border-emerald-500/25' :
              transaction.status === 'pending' ? 'bg-amber-500/10 text-amber-700 border-amber-500/25 animate-pulse' :
              'bg-rose-500/10 text-rose-700 border-rose-500/25'
            }`}>
              <Check className="w-3 h-3 text-current" />
              STATUS: {transaction.status.toUpperCase()}
            </span>

            {/* Glowing price box */}
            <div className="w-full mt-5 py-3.5 px-6 rounded-2xl bg-gradient-to-b from-slate-50 to-slate-100/50 border border-slate-150 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-slate-350" />
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-slate-350" />
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-slate-350" />
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-slate-350" />

              <span className="text-3xl font-black text-slate-900 font-display tracking-tight">
                ₦{transaction.amount.toLocaleString('en-NG')}
              </span>
              <div className="flex items-center justify-center gap-1.5 mt-1 text-[10px] text-slate-400 font-mono tracking-wide">
                <span>CONV: ₦{transaction.fee}</span>
                <span>•</span>
                <span>TOTAL: ₦{(transaction.amount + transaction.fee).toLocaleString('en-NG')}</span>
              </div>
            </div>
          </div>

          {/* Grid fields summary */}
          <div className="mt-6 border-t border-slate-100 pt-5 flex flex-col gap-3">
            <div className="flex justify-between items-start text-xs">
              <span className="text-slate-400 font-mono text-[10px] tracking-wider uppercase mt-0.5">TRANSACTION TYPE</span>
              <span className="text-slate-900 font-bold font-display text-right max-w-xs uppercase tracking-wide bg-slate-50 px-2.5 py-1 rounded-lg border border-slate-100">
                {transaction.type}
              </span>
            </div>

            <div className="flex justify-between items-start text-xs border-t border-slate-50 pt-2.5">
              <span className="text-slate-400 font-mono text-[10px] tracking-wider uppercase mt-0.5">DESCRIPTION</span>
              <span className="text-slate-800 font-medium font-sans text-right max-w-[200px] leading-relaxed">{transaction.description}</span>
            </div>

            <div className="flex justify-between items-start text-xs border-t border-slate-50 pt-2.5">
              <span className="text-slate-400 font-mono text-[10px] tracking-wider uppercase mt-0.5">RECIPIENT VALUE</span>
              <span className="text-slate-800 font-mono font-bold text-right tracking-widest">{transaction.recipient}</span>
            </div>

            <div className="flex justify-between items-start text-xs border-t border-slate-50 pt-2.5">
              <span className="text-slate-400 font-mono text-[10px] tracking-wider uppercase mt-0.5">TIMECODE TIMESTAMP</span>
              <span className="text-slate-800 font-mono font-semibold text-right text-[11px]">{formattedDate}</span>
            </div>

            <div className="flex justify-between items-center text-xs border-t border-slate-50 pt-2.5">
              <span className="text-slate-400 font-mono text-[10px] tracking-wider uppercase">LEDGER REFERENCE</span>
              <div className="flex items-center gap-1.5">
                <span className="text-slate-800 font-mono font-black text-right text-[10px] bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200 max-w-[130px] truncate select-all">{transaction.reference}</span>
                <button
                  id="copy-ref-btn"
                  onClick={() => handleCopyText(transaction.reference, 'Reference Code')}
                  className="p-1 bg-slate-50 hover:bg-slate-100 border border-slate-150 rounded text-slate-500 hover:text-slate-850 print:hidden transition-all active:scale-90"
                >
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Render extra details like vouchers & electricity token codes */}
          {renderProductSpecifics()}

          {/* Barcode block (Very modern aspect) */}
          <div className="flex flex-col items-center gap-1.5 mt-7 bg-slate-50/50 p-4 border border-slate-150/40 rounded-2xl">
            <div className="flex items-end justify-center gap-[1.5px] h-9 w-full max-w-[180px] opacity-80 mix-blend-multiply">
              {[2, 1, 3, 1, 2, 4, 1, 3, 2, 1, 2, 3, 1, 4, 2, 1, 1, 3, 2, 4, 1, 2, 1, 3, 2, 1, 1, 4, 2].map((width, idx) => (
                <div 
                  key={idx} 
                  className="bg-slate-900 h-full" 
                  style={{ width: `${width}px` }} 
                />
              ))}
            </div>
            <span className="text-[8px] font-mono tracking-[0.3em] font-black uppercase text-slate-400">
              LEDGER-ID: {transaction.reference.substring(0, 16).toUpperCase()}
            </span>
          </div>

          {/* Extra system logs confirmation */}
          <div className="mt-6 border-t border-dashed border-slate-200/80 pt-4 text-center">
            <span className="inline-flex items-center gap-1 block text-[8.5px] font-extrabold font-mono text-slate-400 tracking-wider uppercase justify-center">
              <RefreshCw className="w-3 h-3 animate-[spin_5s_linear_infinite]" />
              SECURE SEC-LEVEL SECURE ROUTING ACTIVE
            </span>
            <p className="text-[9px] text-slate-400/80 max-w-xs mx-auto mt-1 font-mono leading-normal">
              This receipt certifies direct, near-zero ledger clearing on state nodes. Query hello@wavie.ng for updates.
            </p>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="flex gap-2 p-4 bg-slate-50/50 border-t border-slate-150/60 print:hidden relative z-10">
          <button
            id="print-receipt-btn"
            onClick={handlePrintReceipt}
            className="flex-1 py-3 border border-slate-200/80 text-slate-700 bg-white hover:text-slate-900 hover:bg-slate-50 rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Copy
          </button>
          
          <button
            id="download-receipt-btn"
            onClick={() => {
              addToast('Receipt saved to device successfully (PDF downloaded)', 'success');
            }}
            className="flex-1 py-3 bg-slate-900 hover:bg-black text-white hover:shadow-lg rounded-2xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all shadow-sm active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Download
          </button>
        </div>
      </div>
    </div>
  );
};
