import React from 'react';
import { X, Check, Copy, Download, Share2, Printer, Award, Lightbulb, Tv, Phone, ShieldCheck } from 'lucide-react';
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
        return <Phone className="w-8 h-8 text-indigo-600" />;
      case 'data':
        return <Phone className="w-8 h-8 text-indigo-600" />;
      case 'electricity':
        return <Lightbulb className="w-8 h-8 text-amber-500" />;
      case 'cable':
        return <Tv className="w-8 h-8 text-rose-500" />;
      case 'education':
        return <Award className="w-8 h-8 text-emerald-600" />;
      default:
        return <ShieldCheck className="w-8 h-8 text-slate-600" />;
    }
  };

  const renderProductSpecifics = () => {
    const details = transaction.details;
    if (!details) return null;

    switch (transaction.type) {
      case 'electricity':
        return (
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-xl text-center">
            <span className="text-xs font-semibold text-amber-800 uppercase tracking-widest font-display block mb-1">
              PROV-PREPAID TOKENCODE
            </span>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl font-bold font-mono text-amber-950 tracking-wider">
                {details.token || '2394-3408-1123-5590-4812'}
              </span>
              <button
                id="copy-token-btn"
                onClick={() => handleCopyText(details.token || '2394-3408-1123-5590-4812', 'Electricity Token')}
                className="p-1 hover:bg-amber-200 rounded-md transition-colors text-amber-800"
                title="Copy Token"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-amber-700 font-medium mt-1">
              Load this onto your meter to complete recharge.
            </p>
          </div>
        );

      case 'education':
        return (
          <div className="mt-4 border-t border-dashed border-slate-200 pt-4 flex flex-col gap-3">
            <span className="text-xs font-semibold text-slate-500 font-display block">
              DELIVERED OFFICIAL EXAM EPIN(s):
            </span>
            {details.pins && details.pins.map((pinItem, idx) => (
              <div key={idx} className="p-3 bg-emerald-50/50 border border-emerald-100 rounded-xl flex flex-col gap-1 text-left relative">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-emerald-800 font-semibold font-display">
                    Voucher {idx + 1} ({details.examType})
                  </span>
                  <button
                    id={`copy-pin-all-${idx}`}
                    onClick={() => handleCopyText(`SERIAL: ${pinItem.serial} | PIN: ${pinItem.pin}`, `Voucher #${idx + 1}`)}
                    className="p-1 hover:bg-emerald-100 rounded-lg text-emerald-800 transition-colors"
                    title="Copy Full Voucher"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-1 text-slate-700">
                  <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase">Serial No:</span>
                    <span className="text-xs font-mono font-bold block select-all">{pinItem.serial}</span>
                  </div>
                  <div className="bg-white px-2 py-1.5 rounded-lg border border-slate-100">
                    <span className="text-[10px] font-medium text-slate-400 block uppercase">PIN Code:</span>
                    <span className="text-xs font-mono font-bold text-slate-800 block select-all">{pinItem.pin}</span>
                  </div>
                </div>
              </div>
            ))}
            <p className="text-[10px] text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg font-medium">
              ✨ Copied cards have also been sent dynamically to your registered Email & Phone WhatsApp list!
            </p>
          </div>
        );

      case 'airtime':
      case 'data':
        return (
          <div className="mt-4 flex items-center justify-between bg-slate-50 border border-slate-100 p-3 rounded-xl">
            <span className="text-xs font-medium text-slate-500">Service Operator:</span>
            <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5 font-display">
              <span className={`w-2 h-2 rounded-full ${
                details.network === 'MTN' ? 'bg-amber-400' :
                details.network === 'Airtel' ? 'bg-red-500' :
                details.network === 'Glo' ? 'bg-green-500' : 'bg-emerald-800'
              }`} />
              {details.network} 
              {details.planName ? ` (${details.planName})` : ' Airtime'}
            </span>
          </div>
        );

      case 'cable':
        return (
          <div className="mt-4 p-3 bg-rose-50/50 border border-rose-100 rounded-xl flex flex-col gap-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-medium text-slate-500">Decoder Provider:</span>
              <span className="font-bold text-slate-800 font-display">{details.provider}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-rose-100/50 pt-2">
              <span className="font-medium text-slate-500">Selected Package:</span>
              <span className="font-bold text-slate-800 font-display">{details.packageName}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-t border-rose-100/50 pt-2">
              <span className="font-medium text-slate-500">Customer Identifier:</span>
              <span className="font-mono font-bold text-slate-800">{details.iucNumber}</span>
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
  });

  const handlePrintReceipt = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:p-0 print:bg-white">
      <div 
        id="receipt-modal-container"
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
        style={{ animation: 'bounceUp 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}
      >
        {/* Modal Top Bar */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50 print:hidden">
          <div className="flex items-center gap-2 text-slate-700 font-semibold font-display">
            Transaction Receipt
          </div>
          <button 
            id="close-receipt-btn" 
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Receipt Content to Print */}
        <div className="p-6 overflow-y-auto flex-grow print:p-8 no-scrollbar" id="printable-receipt-area">
          {/* Logo & Status Badge */}
          <div className="flex flex-col items-center text-center">
            <div className="p-3 bg-slate-100 rounded-full mb-3 inline-block">
              {getIcon()}
            </div>
            
            <h2 className="text-2xl font-black font-display tracking-tight text-slate-900">
              Wavie
            </h2>
            <p className="text-xs text-slate-400 font-medium">Virtual Top-Up & Bills Payment</p>

            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold font-display mt-3 ${
              transaction.status === 'success' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
              transaction.status === 'pending' ? 'bg-amber-100 text-amber-800 border border-amber-200' :
              'bg-red-100 text-red-800 border border-red-200'
            }`}>
              <Check className="w-3.5 h-3.5" />
              {transaction.status.toUpperCase()}
            </span>

            <span className="text-3xl font-extrabold text-slate-800 font-display mt-4">
              ₦{transaction.amount.toLocaleString('en-NG')}
            </span>
            <span className="text-xs text-slate-400 font-mono mt-1">
              Conv. Fee: ₦{transaction.fee} | Total: ₦{(transaction.amount + transaction.fee).toLocaleString('en-NG')}
            </span>
          </div>

          {/* Table Details */}
          <div className="mt-6 border-t border-slate-100 pt-4 flex flex-col gap-3">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium font-sans">Payment Description</span>
              <span className="text-slate-850 font-bold font-display text-right max-w-xs">{transaction.description}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Recipient Target</span>
              <span className="text-slate-800 font-mono font-bold text-right">{transaction.recipient}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Date & Time</span>
              <span className="text-slate-800 font-medium text-right">{formattedDate}</span>
            </div>

            <div className="flex justify-between text-xs">
              <span className="text-slate-400 font-medium">Payment Reference</span>
              <div className="flex items-center gap-1">
                <span className="text-slate-800 font-mono font-semibold text-right text-[11px] bg-slate-50 px-1.5 py-0.5 rounded border border-slate-100 max-w-[120px] truncate select-all">{transaction.reference}</span>
                <button
                  id="copy-ref-btn"
                  onClick={() => handleCopyText(transaction.reference, 'Reference Code')}
                  className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-indigo-600 print:hidden"
                >
                  <Copy className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Service Vouchers or Token */}
          {renderProductSpecifics()}

          {/* Extra Info Footnote */}
          <div className="mt-8 border-t border-dashed border-slate-200 pt-4 text-center">
            <span className="block text-[11px] font-extrabold font-mono text-slate-350 tracking-widest uppercase">
              🔒 POWERED BY AUTOMATED GATEWAYS
            </span>
            <p className="text-[10px] text-slate-400 max-w-xs mx-auto mt-1 leading-normal">
              This receipt verifies the transaction has been dispatched instantly to the service gateway system. For enquiries, contact hello@wavie.ng
            </p>
          </div>
        </div>

        {/* Action Bottom Bar */}
        <div className="flex gap-2 p-4 bg-slate-50 border-t border-slate-100 print:hidden">
          <button
            id="print-receipt-btn"
            onClick={handlePrintReceipt}
            className="flex-1 py-2.5 border border-slate-200 text-slate-700 bg-white rounded-xl text-xs font-semibold hover:bg-slate-50 flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Printer className="w-3.5 h-3.5" />
            Print Receipt
          </button>
          
          <button
            id="download-receipt-btn"
            onClick={() => {
              addToast('Receipt saved to device (Simulated PDF download successful)', 'success');
            }}
            className="flex-1 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 flex items-center justify-center gap-1.5 transition-all shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            PDF Download
          </button>
        </div>
      </div>
    </div>
  );
};
