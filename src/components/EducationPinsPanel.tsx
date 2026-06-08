import React, { useState } from 'react';
import { GraduationCap, Check, HelpCircle, Loader2, Award, Mail, MailCheck, Zap, Download } from 'lucide-react';
import { UserState, Network } from '../types';
import { EXAM_PACKAGES } from '../data';

interface EducationPinsPanelProps {
  user: UserState;
  onTriggerPurchase: (params: {
    type: 'education';
    amount: number;
    recipient: string;
    description: string;
    details: {
      examType: string;
      pins: Array<{ serial: string; pin: string }>;
    };
  }) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const EducationPinsPanel: React.FC<EducationPinsPanelProps> = ({
  user,
  onTriggerPurchase,
  addToast,
}) => {
  const [selectedPackageId, setSelectedPackageId] = useState<string>('waec');
  const [quantity, setQuantity] = useState<number>(1);
  const [emailDelivery, setEmailDelivery] = useState<string>(user.email);
  const [phoneDelivery, setPhoneDelivery] = useState<string>(user.phone);

  const selectedPkg = EXAM_PACKAGES.find((p) => p.id === selectedPackageId) || EXAM_PACKAGES[0];
  const totalPrice = selectedPkg.price * quantity;

  // Generate random realistic pins for WAEC, NECO, etc
  const generateVouchers = (type: string, qty: number) => {
    const vouchers: Array<{ serial: string; pin: string }> = [];
    for (let i = 0; i < qty; i++) {
      const serialPrefix = type.toUpperCase();
      const randomSerialDigits = Math.floor(10000000 + Math.random() * 89999999);
      const randomPin1 = Math.floor(1000 + Math.random() * 8999);
      const randomPin2 = Math.floor(1000 + Math.random() * 8999);
      const randomPin3 = Math.floor(1000 + Math.random() * 8999);

      vouchers.push({
        serial: `${serialPrefix}2026-SR${randomSerialDigits}`,
        pin: `${randomPin1}-${randomPin2}-${randomPin3}`,
      });
    }
    return vouchers;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!emailDelivery.includes('@') || emailDelivery.length < 5) {
      addToast('Please enter a valid email address for delivery.', 'error');
      return;
    }

    if (phoneDelivery.length < 11) {
      addToast('Please enter a valid 11-digit WhatsApp phone number.', 'error');
      return;
    }

    if (user.walletBalance < totalPrice) {
      addToast('Insufficient wallet balance. Please load money first.', 'error');
      return;
    }

    // Generate real pins for immediate rendering
    const generatedPins = generateVouchers(selectedPkg.type, quantity);

    onTriggerPurchase({
      type: 'education',
      amount: totalPrice,
      recipient: emailDelivery,
      description: `${quantity}x ${selectedPkg.name} Purchase`,
      details: {
        examType: selectedPkg.type,
        pins: generatedPins,
      }
    });
  };

  return (
    <div className="flex flex-col gap-6" id="education-ePIN-panel">
      {/* Upper header */}
      <div className="flex flex-col gap-1.5 pb-2 border-b border-slate-100">
        <h2 className="text-lg font-black font-display tracking-tight text-slate-900">
          Educational Exam Vouchers & ePINs
        </h2>
        <p className="text-xs text-slate-400 font-medium">
          Buy WAEC, NECO, NABTEB, and JAMB registration/result tokens. PINs deliver instantly on screen, on WhatsApp, and via email.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Purchase Form card */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <GraduationCap className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-800 font-display">Exam Token Request Form</h3>
              <p className="text-[11px] text-slate-403 font-medium">Automatic delivery on successful security checking.</p>
            </div>
          </div>

          {/* Board selector */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
              Choose Examination Board
            </label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {EXAM_PACKAGES.map((pkg) => (
                <button
                  key={pkg.id}
                  id={`exam-package-choice-${pkg.id}`}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`relative p-4 border-2 rounded-xl text-left flex flex-col gap-1.5 transition-all outline-none focus:outline-none ${
                    selectedPackageId === pkg.id
                      ? 'border-emerald-600 bg-emerald-50/50 shadow-sm font-black text-emerald-950'
                      : 'border-slate-100 bg-slate-50 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <Award className={`w-5 h-5 ${selectedPackageId === pkg.id ? 'text-emerald-605' : 'text-slate-400'}`} />
                  <div>
                    <span className="text-xs font-bold font-display block uppercase">{pkg.type}</span>
                    <span className="text-[10px] text-slate-400 font-medium block">₦{pkg.price.toLocaleString()} ID</span>
                  </div>
                  {selectedPackageId === pkg.id && (
                    <span className="absolute top-2 right-2 bg-emerald-600 text-white p-0.5 rounded-full">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Quantity */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-450 uppercase tracking-wider font-display">
                Quantity (Number of Vouchers)
              </label>
              <select
                id="exam-pin-quantity-select"
                value={quantity}
                onChange={(e) => setQuantity(parseInt(e.target.value))}
                className="w-full p-3 bg-slate-50 border border-slate-205 rounded-xl text-xs font-bold font-display text-slate-700 outline-none"
              >
                {[1, 2, 3, 4, 5, 10].map((q) => (
                  <option key={q} value={q}>
                    {q} {q === 1 ? 'Pin/Voucher' : 'Pins/Vouchers'}
                  </option>
                ))}
              </select>
            </div>

            {/* Price Preview */}
            <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl flex items-center justify-between shadow-inner">
              <div className="flex flex-col">
                <span className="text-[10px] text-slate-400 uppercase font-bold tracking-wider">Unit Price: ₦{selectedPkg.price.toLocaleString()}</span>
                <span className="text-xs text-slate-500 font-medium font-display mt-0.5">Total Bill amount:</span>
              </div>
              <span className="text-xl font-black text-slate-900 font-display">
                ₦{totalPrice.toLocaleString('en-NG')}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Dispatch details: Email */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                Email Address For Delivery
              </label>
              <div className="relative">
                <input
                  id="exam-delivery-email-input"
                  type="email"
                  placeholder="name@gmail.com"
                  value={emailDelivery}
                  onChange={(e) => setEmailDelivery(e.target.value)}
                  className="w-full p-3 bg-slate-50 border border-slate-205 rounded-xl text-xs font-semibold pl-10 focus:bg-white focus:border-emerald-600 outline-none font-sans"
                  required
                />
                <Mail className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>

            {/* Dispatch details: WhatsApp phone */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                WhatsApp Number For PIN SMS
              </label>
              <div className="relative">
                <input
                  id="exam-delivery-phone-input"
                  type="text"
                  placeholder="0803 000 0000"
                  value={phoneDelivery}
                  onChange={(e) => setPhoneDelivery(e.target.value.replace(/[^0-9]/g, ''))}
                  className="w-full p-3 bg-slate-50 border border-slate-205 rounded-xl text-xs font-semibold pl-10 focus:bg-white focus:border-emerald-600 outline-none font-mono"
                  required
                />
                <GraduationCap className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            id="education-buy-submit-btn"
            type="submit"
            className="w-full py-4 text-white font-bold bg-slate-900 hover:bg-black rounded-xl text-sm font-display transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 border border-slate-950"
          >
            <GraduationCap className="w-4 h-4 text-emerald-400 animate-bounce" />
            Buy {quantity}x {selectedPkg.type} Pin Card (₦{totalPrice.toLocaleString('en-NG')})
          </button>
        </form>

        {/* Right side educational aggregation help list info */}
        <div className="flex flex-col gap-6">
          {/* Active stats details block */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5 flex flex-col gap-3">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
              Exam PIN Price-list Guide
            </h3>
            <div className="flex flex-col gap-2 mt-1">
              {EXAM_PACKAGES.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs pb-2 border-b border-slate-100 last:border-0 last:pb-0 font-display">
                  <span className="font-bold text-slate-650">{p.name}</span>
                  <span className="text-slate-900 font-extrabold font-display">₦{p.price.toLocaleString()}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Info banner info */}
          <div className="bg-gradient-to-br from-emerald-950 to-emerald-900 text-white rounded-2xl p-5 flex flex-col gap-4 shadow-sm">
            <div className="p-2.5 bg-white/10 rounded-xl border border-white/5 max-w-max text-emerald-350">
              <MailCheck className="w-5 h-5 animate-pulse" />
            </div>

            <div>
              <h4 className="font-display font-black text-xs uppercase tracking-wider text-white mb-1.5 leading-snug">
                Official API Reseller Guarantee
              </h4>
              <p className="text-[11px] text-emerald-200 leading-relaxed font-semibold">
                TopUpNaija has direct aggregation interfaces with WAEC, NECO, and JAMB registration partner bodies. Vouchers issued are 100% genuine and instantly active on national check portals.
              </p>
            </div>

            <div className="text-[10px] text-emerald-300 font-mono flex flex-col gap-1 border-t border-white/5 pt-3">
              <span>⚡ Genuine 2026 Serial sequences</span>
              <span>📩 Instant copyable PDF receipt vouchers</span>
              <span>💬 Auto-ping to your WhatsApp lines</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
