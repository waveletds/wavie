import React, { useState, useEffect } from 'react';
import { Phone, Check, Database, Zap, Sparkles, UserPlus, Heart } from 'lucide-react';
import { Network, DataPlan, SavedBeneficiary, UserState } from '../types';
import { TELCOS, DATA_PLANS } from '../data';
import { BeneficiarySelector } from './BeneficiarySelector';

interface AirtimeDataPanelProps {
  user: UserState;
  beneficiaries: SavedBeneficiary[];
  onTriggerPurchase: (params: {
    type: 'airtime' | 'data';
    amount: number;
    recipient: string;
    description: string;
    details: {
      network: Network;
      planName?: string;
      saveBeneficiary?: boolean;
      beneficiaryName?: string;
    };
  }) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  initialType?: 'airtime' | 'data';
}

export const AirtimeAndDataPanel: React.FC<AirtimeDataPanelProps> = ({
  user,
  beneficiaries,
  onTriggerPurchase,
  addToast,
  initialType = 'airtime'
}) => {
  const [activeMode, setActiveMode] = useState<'airtime' | 'data'>(initialType);
  const [selectedNetwork, setSelectedNetwork] = useState<Network>('MTN');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  
  // Airtime properties
  const [airtimeAmount, setAirtimeAmount] = useState<string>('');
  const [cashbackAmount, setCashbackAmount] = useState<number>(0);

  // Data properties
  const [activePlanCategory, setActivePlanCategory] = useState<'daily' | 'weekly' | 'monthly' | 'sme'>('daily');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');

  // Beneficiary details
  const [saveBeneficiary, setSaveBeneficiary] = useState<boolean>(false);
  const [beneficiaryName, setBeneficiaryName] = useState<string>('');

  // Auto-detect network via phone prefix
  useEffect(() => {
    if (phoneNumber.length >= 4) {
      const prefix = phoneNumber.substring(0, 4);
      const matchedTelco = TELCOS.find((t) => t.prefixes.includes(prefix));
      if (matchedTelco && matchedTelco.name !== selectedNetwork) {
        setSelectedNetwork(matchedTelco.name);
        addToast(`Detected ${matchedTelco.name} network automatically.`, 'info');
      }
    }
  }, [phoneNumber]);

  // Calculate airtime cash back
  useEffect(() => {
    const amountNum = parseFloat(airtimeAmount) || 0;
    const telcoObj = TELCOS.find((t) => t.name === selectedNetwork);
    if (telcoObj && amountNum > 0) {
      const percent = telcoObj.cashbackPercent;
      setCashbackAmount((amountNum * percent) / 100);
    } else {
      setCashbackAmount(0);
    }
  }, [airtimeAmount, selectedNetwork]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/[^0-9]/g, '');
    if (val.length <= 11) {
      setPhoneNumber(val);
    }
  };

  const handleAirtimePreset = (amt: number) => {
    setAirtimeAmount(amt.toString());
  };

  const handleSelectBeneficiary = (b: SavedBeneficiary) => {
    setPhoneNumber(b.value);
    setSelectedNetwork(b.provider as Network);
    addToast(`Beneficiary ${b.name} details loaded.`, 'success');
  };

  const activeTelco = TELCOS.find((t) => t.name === selectedNetwork) || TELCOS[0];
  const plansList = DATA_PLANS[selectedNetwork].filter((p) => p.category === activePlanCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Check generic inputs
    if (phoneNumber.length < 11) {
      addToast('Please enter a valid 11-digit Nigerian phone number.', 'error');
      return;
    }

    if (saveBeneficiary && !beneficiaryName.trim()) {
      addToast('Please enter a nickname for the beneficiary.', 'error');
      return;
    }

    if (activeMode === 'airtime') {
      const amtNum = parseFloat(airtimeAmount) || 0;
      if (amtNum < 50 || amtNum > 50000) {
        addToast('Airtime purchase amount must be between ₦50 and ₦50,000.', 'error');
        return;
      }

      if (user.walletBalance < amtNum) {
        addToast('Insufficient wallet balance. Please fund your wallet first.', 'error');
        return;
      }

      onTriggerPurchase({
        type: 'airtime',
        amount: amtNum,
        recipient: phoneNumber,
        description: `₦${amtNum.toLocaleString()} ${selectedNetwork} Airtime Recharge`,
        details: {
          network: selectedNetwork,
          saveBeneficiary,
          beneficiaryName: beneficiaryName.trim() || undefined,
        }
      });
    } else {
      // Data purchase flow
      const planObj = DATA_PLANS[selectedNetwork].find((p) => p.id === selectedPlanId);
      if (!planObj) {
        addToast('Please select a data bundle plan.', 'error');
        return;
      }

      if (user.walletBalance < planObj.price) {
        addToast('Insufficient wallet balance. Please fund your wallet first.', 'error');
        return;
      }

      onTriggerPurchase({
        type: 'data',
        amount: planObj.price,
        recipient: phoneNumber,
        description: `${selectedNetwork} Data Plan Recharge (${planObj.allowance} - ${planObj.validity})`,
        details: {
          network: selectedNetwork,
          planName: `${planObj.allowance} Plan (${planObj.validity})`,
          saveBeneficiary,
          beneficiaryName: beneficiaryName.trim() || undefined,
        }
      });
    }
  };

  return (
    <div className="flex flex-col gap-6 animate-fade-in-up" id="airtime-data-feature">
      {/* Upper Mode Selector tabs - Premium Silk look */}
      <div className="bg-slate-200/50 backdrop-blur-md p-1 border border-[#E5E2DA]/60 rounded-2xl flex max-w-md w-full">
        <button
          id="mode-airtime-tab"
          onClick={() => {
            setActiveMode('airtime');
            setSelectedPlanId('');
          }}
          className={`flex-1 py-3 text-xs sm:text-sm font-black font-display rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMode === 'airtime' 
              ? 'bg-white text-slate-950 shadow-sm border border-[#E5E2DA]/40' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Phone className="w-4 h-4 text-indigo-600" />
          Buy Airtime (Credit)
        </button>
        <button
          id="mode-data-tab"
          onClick={() => {
            setActiveMode('data');
            // Auto Select first plan in cat
            const firstPlan = DATA_PLANS[selectedNetwork].find((p) => p.category === activePlanCategory);
            if (firstPlan) setSelectedPlanId(firstPlan.id);
          }}
          className={`flex-1 py-3 text-xs sm:text-sm font-black font-display rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeMode === 'data' 
              ? 'bg-white text-slate-950 shadow-sm border border-[#E5E2DA]/40' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Database className="w-4 h-4 text-emerald-600" />
          Buy Data (Internet)
        </button>
      </div>
 
      {/* Main card panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Form controls */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white/90 rounded-3xl border border-[#E5E2DA]/70 shadow-[0_12px_44px_-10px_rgba(115,108,92,0.04)] p-6 sm:p-8 flex flex-col gap-6">
          <div className="flex items-center gap-2.5 border-b border-slate-50 pb-4">
            <span className="p-2.5 bg-emerald-50 text-emerald-600 border border-emerald-150 rounded-xl">
              {activeMode === 'airtime' ? <Phone className="w-5 h-5 text-emerald-700" /> : <Database className="w-5 h-5 text-emerald-700" />}
            </span>
            <div>
              <h2 className="text-sm font-black text-slate-900 font-display uppercase tracking-wide">
                {activeMode === 'airtime' ? 'Instant Airtime Top-Up' : 'Instant High-Speed Data Bundles'}
              </h2>
              <p className="text-[10px] text-slate-400 font-medium">Recharge your phone line in 5 seconds flat with automated delivery.</p>
            </div>
          </div>
 
          {/* Telco Operator Choice */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
              Select Operator
            </label>
            <div className="grid grid-cols-2 min-[330px]:grid-cols-4 gap-2.5 sm:gap-3">
              {TELCOS.map((telco) => (
                <button
                  key={telco.name}
                  id={`operator-choice-${telco.name}`}
                  type="button"
                  onClick={() => {
                    setSelectedNetwork(telco.name);
                    setSelectedPlanId('');
                  }}
                  className={`relative p-3 sm:p-4 border rounded-2xl text-center flex flex-col items-center justify-center font-display font-black tracking-wide text-xs transition-all duration-300 active:scale-95 cursor-pointer ${
                    selectedNetwork === telco.name
                      ? `${telco.borderColor} ${telco.brandColor} shadow-sm border-2 scale-[1.02]`
                      : 'border-[#E5E2DA]/90 bg-[#FAF9F6]/50 text-slate-600 hover:bg-white hover:border-slate-400'
                  }`}
                >
                  {telco.name}
                  {selectedNetwork === telco.name && (
                    <span className="absolute -top-1.5 -right-1.5 bg-slate-900 border border-white text-white p-0.5 rounded-full shadow">
                      <Check className="w-2.5 h-2.5 stroke-[3]" />
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Recipient details */}
          <div className="flex flex-col gap-2">
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
              Phone Number
            </label>
            <div className="relative">
              <input
                id="recharge-phone-input"
                type="text"
                placeholder="0803 000 0000"
                value={phoneNumber}
                onChange={handlePhoneChange}
                className="w-full p-3.5 bg-slate-50 border border-slate-205 focus:bg-white focus:border-emerald-500 outline-none rounded-xl font-mono text-base font-bold shadow-inner tracking-widest pl-11 focus:ring-4 focus:ring-emerald-50 transition-all"
                required
              />
              <Phone className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
              {phoneNumber.length === 11 && (
                <span className="absolute right-3.5 top-3.5 text-xs text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full font-bold border border-emerald-100">
                  Phone OK
                </span>
              )}
            </div>
            {phoneNumber.length > 0 && phoneNumber.length < 11 && (
              <span className="text-[10px] text-amber-600 font-semibold">
                Waiting for {11 - phoneNumber.length} more digits...
              </span>
            )}
          </div>

          {/* Mode Particular: Dynamic inputs */}
          {activeMode === 'airtime' ? (
            /* Airtime Amount form */
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Recharge Amount (₦)
                </label>
                <input
                  id="recharge-airtime-amount"
                  type="number"
                  placeholder="Insert amount between N50 - N50,000"
                  min={50}
                  max={50000}
                  value={airtimeAmount}
                  onChange={(e) => setAirtimeAmount(e.target.value)}
                  className="w-full p-4 bg-slate-50 border border-slate-205 focus:bg-white focus:border-emerald-500 outline-none rounded-xl font-display text-xl font-bold tracking-tight shadow-inner focus:ring-4 focus:ring-emerald-100 transition-all"
                  required
                />
                
                {/* Cashback preview */}
                {cashbackAmount > 0 && (
                  <div className="inline-flex gap-1.5 items-center px-3 py-1 bg-emerald-50 text-emerald-800 text-xs font-bold rounded-lg border border-emerald-100 w-fit">
                    <Sparkles className="w-3.5 h-3.5 animate-pulse text-emerald-600" />
                    Cashback Reward: +₦{cashbackAmount.toFixed(2)} (Earn {activeTelco.cashbackPercent}% instantly!)
                  </div>
                )}
              </div>

              {/* Amount Quick Presets */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Quick Select Presets</span>
                <div className="grid grid-cols-3 min-[480px]:grid-cols-6 gap-2">
                  {[100, 200, 500, 1000, 2000, 5000].map((presetAmt) => (
                    <button
                      key={presetAmt}
                      id={`preset-airtime-${presetAmt}`}
                      type="button"
                      onClick={() => handleAirtimePreset(presetAmt)}
                      className="py-2.5 px-1 border border-slate-200 text-slate-700 bg-white hover:border-emerald-500 hover:text-emerald-600 rounded-lg text-xs font-bold font-display transition-all active:scale-95 shadow-sm"
                    >
                      ₦{presetAmt.toLocaleString('en-NG')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Data Plan Selection Form */
            <div className="flex flex-col gap-4">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                Select Data Bundle Plan
              </label>

              {/* Data Categories Switch tabs */}
              <div className="flex border-b border-slate-100 gap-1 overflow-x-auto pb-0.5">
                {(['daily', 'weekly', 'monthly', 'sme'] as const).map((catName) => (
                  <button
                    key={catName}
                    id={`data-category-tab-${catName}`}
                    type="button"
                    onClick={() => {
                      setActivePlanCategory(catName);
                      setSelectedPlanId('');
                    }}
                    className={`pb-2 px-4 text-xs font-bold font-display border-b-2 capitalize transition-all focus:outline-none whitespace-nowrap ${
                      activePlanCategory === catName
                        ? 'border-emerald-600 text-emerald-600'
                        : 'border-transparent text-slate-400 hover:text-slate-650'
                    }`}
                  >
                    {catName === 'sme' ? 'SME Bulk Plans' : `${catName} packs`}
                  </button>
                ))}
              </div>

              {/* Plans Radio listing list */}
              <div className="flex flex-col gap-2 max-h-56 overflow-y-auto pr-1 no-scrollbar border border-slate-100 rounded-xl p-2 bg-slate-50/50">
                {plansList.length === 0 ? (
                  <span className="text-xs text-slate-400 italic p-4 text-center">No active plans under this group.</span>
                ) : (
                  plansList.map((plan) => (
                    <button
                      key={plan.id}
                      id={`data-plan-option-${plan.id}`}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full p-3 border rounded-xl flex items-center justify-between text-left transition-all ${
                        selectedPlanId === plan.id
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-900 shadow-sm'
                          : 'border-slate-150 bg-white text-slate-705 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="text-xs font-bold font-display">{plan.name}</span>
                        <span className="text-[10px] text-slate-400 font-medium">Valid: {plan.validity} • Volume: {plan.allowance}</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 font-display">₦{plan.price.toLocaleString()}</span>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Optional Beneficiary checklist */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            <label className="relative flex items-center gap-2 cursor-pointer select-none">
              <input
                id="save-beneficiary-checkbox"
                type="checkbox"
                checked={saveBeneficiary}
                onChange={(e) => setSaveBeneficiary(e.target.checked)}
                className="w-4.5 h-4.5 text-indigo-600 bg-slate-50 border-slate-200 rounded focus:ring-indigo-500 check:bg-indigo-600"
              />
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
                <UserPlus className="w-3.5 h-3.5 text-indigo-600" />
                Save recipient as beneficiary
              </span>
            </label>

            {saveBeneficiary && (
              <div className="flex flex-col gap-1.5" id="beneficiary-nickname-field">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Beneficiary Nickname / Label</label>
                <input
                  id="beneficiary-name-input"
                  type="text"
                  placeholder="e.g. Grandma Glo, My Laptop Sim, Ada MTN"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full p-2.5 border border-slate-205 bg-slate-50 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-500 outline-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Primary Action Button */}
          <button
            id="recharge-submit-btn"
            type="submit"
            className="w-full py-4 text-white rounded-xl bg-slate-900 border border-slate-950 font-bold font-display text-sm hover:bg-black transition-all shadow-md active:scale-95 hover:shadow-lg flex items-center justify-center gap-2"
          >
            <Zap className="w-4 h-4 text-amber-400 animate-pulse" />
            {activeMode === 'airtime' 
              ? `Proceed with ₦${airtimeAmount ? parseFloat(airtimeAmount).toLocaleString() : '0'} Airtime Purchase` 
              : `Proceed with ${selectedPlanId ? DATA_PLANS[selectedNetwork].find((p) => p.id === selectedPlanId)?.allowance : ''} Data Bundle`
            }
          </button>
        </form>

        {/* Right side helper cards (saved beneficiaries, safety checklist) */}
        <div className="flex flex-col gap-6">
          {/* Saved Beneficiaries card */}
          <div className="bg-slate-50/70 border border-slate-100 rounded-2xl p-5">
            <BeneficiarySelector
              beneficiaries={beneficiaries}
              onSelect={handleSelectBeneficiary}
              activeType="phone"
              label="Phone Beneficiaries"
            />
          </div>

          {/* Safety & Delivery SLA status card */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl flex flex-col gap-4">
            <div className="p-2.5 bg-white/10 border border-white/5 rounded-xl max-w-max">
              <Zap className="w-5 h-5 text-amber-300 fill-amber-300 animate-pulse" />
            </div>

            <div>
              <h3 className="font-display font-black text-sm tracking-tight text-white mb-1.5 uppercase">
                Instant Delivery SLA
              </h3>
              <p className="text-[11px] text-slate-350 leading-relaxed font-semibold">
                Our telecommunications router runs directly concurrently with network operators (MTN, Airtel, Glo, & 9mobile). Airtime and broadband data packages are validated and credited onto target lines within 5 seconds.
              </p>
            </div>

            <div className="border-t border-white/10 pt-3 flex flex-col gap-1 text-[10px] text-slate-400 font-mono">
              <span>🛡️ Secure Gateway Verification</span>
              <span>🔒 100% Fail-stop protection built in</span>
              <span>⚡ Auto-cashback credited straight to wallet</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
