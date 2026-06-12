import React, { useState, useEffect } from 'react';
import { Lightbulb, Tv, Check, Eye, AlertCircle, RefreshCw, UserCheck, ShieldAlert, Sparkles, Trophy } from 'lucide-react';
import { UserState, SavedBeneficiary, Network } from '../types';
import { DISCOS, CABLE_PROVIDERS, MOCK_NAMES } from '../data';
import { BeneficiarySelector } from './BeneficiarySelector';

const BETTING_PROVIDERS = [
  { id: 'sportybet', name: 'SportyBet', placeholder: 'Enter SportyBet Customer ID (e.g. 5892014)' },
  { id: 'bet9ja', name: 'Bet9ja', placeholder: 'Enter Bet9ja User Account ID (e.g. 3394821)' },
  { id: '1xbet', name: '1xBet', placeholder: 'Enter 1xBet Player ID (e.g. 8492041)' },
  { id: 'betking', name: 'BetKing', placeholder: 'Enter BetKing User ID (e.g. 2938174)' },
];

interface BillsRechargePanelProps {
  user: UserState;
  beneficiaries: SavedBeneficiary[];
  onTriggerPurchase: (params: {
    type: 'electricity' | 'cable' | 'betting';
    amount: number;
    recipient: string;
    description: string;
    details: {
      disco?: string;
      meterNumber?: string;
      provider?: string;
      packageName?: string;
      iucNumber?: string;
      accountId?: string;
      token?: string; // For prepaid electric
      saveBeneficiary?: boolean;
      beneficiaryName?: string;
    };
  }) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const BillsRechargePanel: React.FC<BillsRechargePanelProps> = ({
  user,
  beneficiaries,
  onTriggerPurchase,
  addToast,
}) => {
  const [activeTab, setActiveTab] = useState<'electricity' | 'cable' | 'betting'>('electricity');

  // Electricity variables
  const [selectedDiscoId, setSelectedDiscoId] = useState<string>('ikedc');
  const [meterNumber, setMeterNumber] = useState<string>('');
  const [electricAmount, setElectricAmount] = useState<string>('');
  const [isValidatingElectric, setIsValidatingElectric] = useState<boolean>(false);
  const [validatedElectricClass, setValidatedElectricClass] = useState<{
    customerName: string;
    address: string;
    meterType: string;
    isValidated: boolean;
  } | null>(null);

  // Cable variables
  const [selectedCableId, setSelectedCableId] = useState<string>('dstv');
  const [iucNumber, setIucNumber] = useState<string>('');
  const [selectedPlanId, setSelectedPlanId] = useState<string>('');
  const [isValidatingCable, setIsValidatingCable] = useState<boolean>(false);
  const [validatedCableClass, setValidatedCableClass] = useState<{
    customerName: string;
    currentPackage: string;
    dueDate: string;
    isValidated: boolean;
  } | null>(null);

  // Betting variables
  const [selectedBettingId, setSelectedBettingId] = useState<string>('sportybet');
  const [bettingUserId, setBettingUserId] = useState<string>('');
  const [bettingAmount, setBettingAmount] = useState<string>('');
  const [isValidatingBetting, setIsValidatingBetting] = useState<boolean>(false);
  const [validatedBettingClass, setValidatedBettingClass] = useState<{
    customerName: string;
    accountId: string;
    status: string;
    isValidated: boolean;
  } | null>(null);

  // Save beneficiaries
  const [saveBeneficiary, setSaveBeneficiary] = useState<boolean>(false);
  const [beneficiaryName, setBeneficiaryName] = useState<string>('');

  // Auto-fill selected beneficiary
  const handleSelectBeneficiary = (b: SavedBeneficiary) => {
    if (b.type === 'meter') {
      setActiveTab('electricity');
      const matchedDisco = DISCOS.find((d) => d.shortName.includes(b.provider) || d.id === b.provider);
      if (matchedDisco) setSelectedDiscoId(matchedDisco.id);
      setMeterNumber(b.value);
      setValidatedElectricClass(null);
      addToast(`Meter beneficiary ${b.name} loaded.`, 'success');
    } else if (b.type === 'iuc') {
      setActiveTab('cable');
      const matchedCable = CABLE_PROVIDERS.find((c) => c.name.includes(b.provider) || c.id === b.provider);
      if (matchedCable) {
        setSelectedCableId(matchedCable.id);
        const autoPlan = matchedCable.plans[0];
        if (autoPlan) setSelectedPlanId(autoPlan.id);
      }
      setIucNumber(b.value);
      setValidatedCableClass(null);
      addToast(`Smartcard beneficiary ${b.name} loaded.`, 'success');
    }
  };

  // Run dynamic verification checks
  const handleValidateElectric = () => {
    if (meterNumber.trim().length < 8) {
      addToast('Please enter a valid meter number (minimum 8 digits).', 'error');
      return;
    }

    setIsValidatingElectric(true);
    setValidatedElectricClass(null);

    setTimeout(() => {
      setIsValidatingElectric(false);
      const randomName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      const discoObj = DISCOS.find((d) => d.id === selectedDiscoId);
      
      setValidatedElectricClass({
        customerName: randomName,
        address: `No. 42 ${discoObj ? discoObj.state : 'Lagos'} Utility Crescent, Central Estate Area.`,
        meterType: 'Prepaid (Residential Single-Phase)',
        isValidated: true,
      });
      addToast('Electricity meter verified successfully!', 'success');
    }, 1200);
  };

  const handleValidateCable = () => {
    if (iucNumber.trim().length < 9) {
      addToast('Please enter a valid IUC/Smartcard number (minimum 9 digits).', 'error');
      return;
    }

    setIsValidatingCable(true);
    setValidatedCableClass(null);

    setTimeout(() => {
      setIsValidatingCable(false);
      const randomName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      const providerObj = CABLE_PROVIDERS.find((c) => c.id === selectedCableId);
      
      setValidatedCableClass({
        customerName: randomName,
        currentPackage: providerObj ? `${providerObj.name} Compact` : 'Basic Package',
        dueDate: 'Within 3 Days (Renewal Overdue)',
        isValidated: true,
      });
      addToast('Smartcard/IUC owner verified successfully!', 'success');
    }, 1200);
  };

  const handleValidateBetting = () => {
    if (bettingUserId.trim().length < 6) {
      addToast('Please enter a valid sports betting User ID (minimum 6 digits).', 'error');
      return;
    }

    setIsValidatingBetting(true);
    setValidatedBettingClass(null);

    setTimeout(() => {
      setIsValidatingBetting(false);
      const randomName = MOCK_NAMES[Math.floor(Math.random() * MOCK_NAMES.length)];
      
      setValidatedBettingClass({
        customerName: randomName,
        accountId: bettingUserId,
        status: 'Active Registered Betting Node Client',
        isValidated: true,
      });
      addToast('Sports betting account verified successfully!', 'success');
    }, 1200);
  };

  // Run initial package selections
  useEffect(() => {
    const providerObj = CABLE_PROVIDERS.find((c) => c.id === selectedCableId);
    if (providerObj && providerObj.plans.length > 0) {
      setSelectedPlanId(providerObj.plans[0].id);
    }
    setValidatedCableClass(null);
  }, [selectedCableId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (saveBeneficiary && !beneficiaryName.trim()) {
      addToast('Please input a nickname for the saved beneficiary.', 'error');
      return;
    }

    if (activeTab === 'electricity') {
      const amtNum = parseFloat(electricAmount) || 0;
      if (!validatedElectricClass || !validatedElectricClass.isValidated) {
        addToast('Please validate your electric meter number before paying.', 'error');
        return;
      }

      if (amtNum < 1000 || amtNum > 200000) {
        addToast('Electricity recharge amount must be between ₦1,000 and ₦200,000.', 'error');
        return;
      }

      if (user.walletBalance < amtNum) {
        addToast('Insufficient wallet balance. Please load funds first.', 'error');
        return;
      }

      const discoObj = DISCOS.find((d) => d.id === selectedDiscoId);
      
      // Generate transaction token code
      const tok1 = Math.floor(1000 + Math.random() * 9000);
      const tok2 = Math.floor(1000 + Math.random() * 9000);
      const tok3 = Math.floor(1000 + Math.random() * 9000);
      const tok4 = Math.floor(1000 + Math.random() * 9000);
      const randToken = `${tok1}-${tok2}-${tok3}-${tok4}`;

      onTriggerPurchase({
        type: 'electricity',
        amount: amtNum,
        recipient: meterNumber,
        description: `₦${amtNum.toLocaleString()} electricity recharge for meter ${meterNumber} (${discoObj?.shortName})`,
        details: {
          disco: discoObj?.shortName,
          meterNumber,
          token: randToken,
          saveBeneficiary,
          beneficiaryName: beneficiaryName.trim() || undefined
        }
      });
    } else if (activeTab === 'cable') {
      // Cable renewal
      if (!validatedCableClass || !validatedCableClass.isValidated) {
        addToast('Please validate your decoder Smartcard/IUC number first.', 'error');
        return;
      }

      const providerObj = CABLE_PROVIDERS.find((c) => c.id === selectedCableId);
      const planObj = providerObj?.plans.find((p) => p.id === selectedPlanId);

      if (!planObj) {
        addToast('Please pick a subscription bouquet plan.', 'error');
        return;
      }

      const totalFee = planObj.price; // No additional fee

      if (user.walletBalance < totalFee) {
        addToast('Insufficient balance for this cable bouquet plan.', 'error');
        return;
      }

      onTriggerPurchase({
        type: 'cable',
        amount: totalFee,
        recipient: iucNumber,
        description: `${providerObj?.name} Bouquet Renewal (${planObj.name})`,
        details: {
          provider: providerObj?.name,
          packageName: planObj.name,
          iucNumber,
          saveBeneficiary,
          beneficiaryName: beneficiaryName.trim() || undefined
        }
      });
    } else if (activeTab === 'betting') {
      // Bet account funding
      if (!validatedBettingClass || !validatedBettingClass.isValidated) {
        addToast('Please validate your Player User ID before paying.', 'error');
        return;
      }

      const amtNum = parseFloat(bettingAmount) || 0;
      if (amtNum < 100 || amtNum > 100000) {
        addToast('Bet account funding value must be between ₦100 and ₦100,000.', 'error');
        return;
      }

      if (user.walletBalance < amtNum) {
        addToast('Insufficient wallet balance. Please load funds first.', 'error');
        return;
      }

      const betProviderObj = BETTING_PROVIDERS.find((b) => b.id === selectedBettingId);

      onTriggerPurchase({
        type: 'betting',
        amount: amtNum,
        recipient: bettingUserId,
        description: `${betProviderObj?.name} User ${bettingUserId} Fund Deposit`,
        details: {
          provider: betProviderObj?.name,
          accountId: bettingUserId,
          saveBeneficiary,
          beneficiaryName: beneficiaryName.trim() || undefined
        }
      });
    }
  };

  const currentCableProvider = CABLE_PROVIDERS.find((c) => c.id === selectedCableId);

  return (
    <div className="flex flex-col gap-6" id="bills-feature-panel">
      {/* Upper Dual Switch tabs */}
      <div className="bg-slate-100 p-1.5 rounded-2xl flex max-w-lg w-full">
        <button
          id="bill-tab-electricity"
          onClick={() => {
            setActiveTab('electricity');
            setSaveBeneficiary(false);
            setBeneficiaryName('');
          }}
          className={`flex-1 py-3 text-xs font-bold font-display rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'electricity' 
              ? 'bg-white text-slate-950 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lightbulb className="w-4 h-4 text-amber-500" />
          Nepa Electricity
        </button>
        <button
          id="bill-tab-cable"
          onClick={() => {
            setActiveTab('cable');
            setSaveBeneficiary(false);
            setBeneficiaryName('');
          }}
          className={`flex-1 py-3 text-xs font-bold font-display rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'cable' 
              ? 'bg-white text-slate-950 shadow-sm' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Tv className="w-4 h-4 text-rose-500" />
          Decoder TV Cable
        </button>
        <button
          id="bill-tab-betting"
          onClick={() => {
            setActiveTab('betting');
            setSaveBeneficiary(false);
            setBeneficiaryName('');
          }}
          className={`flex-1 py-3 text-xs font-bold font-display rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === 'betting' 
              ? 'bg-white text-slate-950 shadow-sm animate-fade-in' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <Trophy className="w-4 h-4 text-emerald-500 animate-bounce" />
          Betting Funding
        </button>
      </div>

      {/* Main card panels splits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form area list */}
        <form onSubmit={handleSubmit} className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
          <div className="flex items-center gap-2 border-b border-slate-50 pb-3">
            <span className="p-2 bg-slate-50 rounded-xl animate-pulse">
              {activeTab === 'electricity' ? (
                <Lightbulb className="w-5 h-5 text-amber-500" />
              ) : activeTab === 'cable' ? (
                <Tv className="w-5 h-5 text-rose-500" />
              ) : (
                <Trophy className="w-5 h-5 text-emerald-500" />
              )}
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-800 font-display">
                {activeTab === 'electricity' ? 'Prepaid Electricity Token' : activeTab === 'cable' ? 'Decoder Subscriptions' : 'Sports Betting Account Funding'}
              </h2>
              <p className="text-[11px] text-slate-400 font-medium">Auto-dispatching validation and instant wallet settlement.</p>
            </div>
          </div>

          {/* Form specific logic */}
          {activeTab === 'electricity' ? (
            /* Electricity bill payments */
            <div className="flex flex-col gap-4">
              {/* Select Distribution Company "Disco" */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Select Distribution Company (Disco)
                </label>
                <div className="relative">
                  <select
                    id="disco-provider-select"
                    value={selectedDiscoId}
                    onChange={(e) => {
                      setSelectedDiscoId(e.target.value);
                      setValidatedElectricClass(null);
                    }}
                    className="w-full p-3.5 bg-slate-50 border border-slate-205 rounded-xl font-display text-sm font-bold text-slate-700 outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-50 transition-all font-semibold"
                  >
                    {DISCOS.map((disco) => (
                      <option key={disco.id} value={disco.id}>
                        {disco.shortName} - ({disco.state} state)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Meter verification fields and actions */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Meter Account Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      id="meter-number-input"
                      type="text"
                      placeholder="Enter 11-13 digit meter number"
                      value={meterNumber}
                      onChange={(e) => {
                        setMeterNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setValidatedElectricClass(null);
                      }}
                      className="w-full p-3.5 bg-slate-50 border border-slate-205 rounded-xl text-sm font-mono font-black tracking-widest pl-10 focus:bg-white focus:border-indigo-600 outline-none"
                      required
                    />
                    <Lightbulb className="absolute left-3.5 top-4 w-4 h-4 text-slate-450" />
                  </div>

                  <button
                    id="validate-meter-btn"
                    type="button"
                    onClick={handleValidateElectric}
                    disabled={isValidatingElectric}
                    className="px-4 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-bold font-display transition-colors active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isValidatingElectric ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    Verify Account
                  </button>
                </div>
              </div>

              {/* Electricity validation verification output */}
              {validatedElectricClass && validatedElectricClass.isValidated && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col gap-1 text-xs shadow-inner" id="electric-validation-box">
                  <span className="text-[10px] font-black text-emerald-800 tracking-wider font-display uppercase block">
                    Verified Customer Node Profile:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5 text-slate-700 font-medium">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-display">CUSTOMER NAME:</span>
                      <span className="text-slate-800 font-bold font-display uppercase">{validatedElectricClass.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-display">METER ACCOUNT TYPE:</span>
                      <span className="text-slate-800 font-mono font-bold text-xs">{validatedElectricClass.meterType}</span>
                    </div>
                    <div className="md:col-span-2 border-t border-emerald-100/55 pt-1.5 mt-0.5">
                      <span className="text-slate-400 text-[10px] block font-display">REGISTERED PHYSICAL ADDRESS:</span>
                      <span className="text-slate-700 italic select-all leading-normal">{validatedElectricClass.address}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Amount input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Electric Purchase Value (₦)
                </label>
                <input
                  id="electric-recharge-amount"
                  type="number"
                  placeholder="Min N1,000 - Max N200,000"
                  min={1000}
                  max={200000}
                  value={electricAmount}
                  onChange={(e) => setElectricAmount(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-205 rounded-xl font-display text-lg font-black tracking-tight outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-semibold"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium font-sans">Convenience processing surcharge fee: ₦100 convenience charge apply on electricity bills.</span>
              </div>
            </div>
          ) : activeTab === 'cable' ? (
            /* Cable Decoder renewal payments */
            <div className="flex flex-col gap-4">
              {/* Choose Cable Provider */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Select Decoder Provider
                </label>
                <div className="grid grid-cols-2 min-[400px]:grid-cols-4 gap-3">
                  {CABLE_PROVIDERS.map((cable) => (
                    <button
                      key={cable.id}
                      id={`cable-provider-choice-${cable.id}`}
                      type="button"
                      onClick={() => setSelectedCableId(cable.id)}
                      className={`relative p-3 border-2 rounded-xl text-center font-display font-bold text-xs transition-colors active:scale-95 ${
                        selectedCableId === cable.id
                          ? 'border-indigo-600 bg-indigo-50/60 text-indigo-950 font-black shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {cable.name.split(' ')[0]}
                      {selectedCableId === cable.id && (
                        <span className="absolute -top-1.5 -right-1.5 bg-indigo-600 border border-white text-white p-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* IUC Account input */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Smartcard / IUC Identifier Number
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      id="smartcard-iuc-input"
                      type="text"
                      placeholder="decoder smartcard number"
                      value={iucNumber}
                      onChange={(e) => {
                        setIucNumber(e.target.value.replace(/[^0-9]/g, ''));
                        setValidatedCableClass(null);
                      }}
                      className="w-full p-3.5 bg-slate-50 border border-slate-205 rounded-xl text-sm font-mono font-black tracking-widest pl-10 focus:bg-white focus:border-indigo-600 outline-none"
                      required
                    />
                    <Tv className="absolute left-3.5 top-4 w-4 h-4 text-slate-450" />
                  </div>

                  <button
                    id="validate-smartcard-btn"
                    type="button"
                    onClick={handleValidateCable}
                    disabled={isValidatingCable}
                    className="px-4 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-bold font-display transition-colors active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    {isValidatingCable ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    Verify smartcard
                  </button>
                </div>
              </div>

              {/* Smartcard Owner validation metrics output */}
              {validatedCableClass && validatedCableClass.isValidated && (
                <div className="p-4 bg-rose-50/50 border border-rose-100 rounded-xl flex flex-col gap-1 text-xs shadow-inner animate-fade-in" id="cable-validation-box">
                  <span className="text-[10px] font-black text-rose-800 tracking-wider font-display uppercase block">
                    Decoder Card Profiles Active Info:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5 text-slate-705 font-medium">
                    <div>
                      <span className="text-slate-400 text-[10px] block font-display">SUBSCRIBER NAME:</span>
                      <span className="text-rose-900 font-bold font-display uppercase">{validatedCableClass.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-[10px] block font-display">CURRENT REGISTERED PLAN:</span>
                      <span className="text-rose-900 font-bold text-xs">{validatedCableClass.currentPackage}</span>
                    </div>
                    <div className="md:col-span-2 border-t border-rose-100 pt-1.5 mt-0.5 flex items-center gap-1">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 animate-pulse" />
                      <div>
                        <span className="text-slate-400 text-[10px] block font-display">SERVICE DUE DATE STATUS:</span>
                        <span className="text-rose-700 font-bold italic">{validatedCableClass.dueDate}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Package selection and details */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Select Bouquet Package
                </label>
                <div className="flex flex-col gap-2 max-h-52 overflow-y-auto pr-1 border border-slate-150 rounded-xl p-2 bg-slate-50/50 no-scrollbar">
                  {currentCableProvider?.plans.map((plan) => (
                    <button
                      key={plan.id}
                      id={`cable-plan-option-${plan.id}`}
                      type="button"
                      onClick={() => setSelectedPlanId(plan.id)}
                      className={`w-full p-3 border rounded-xl flex items-center justify-between text-left transition-all ${
                        selectedPlanId === plan.id
                          ? 'border-emerald-600 bg-emerald-50/80 text-emerald-950 shadow-sm'
                          : 'border-slate-150 bg-white text-slate-705 hover:bg-slate-50'
                      }`}
                    >
                      <div className="flex flex-col">
                        <span className="text-xs font-bold font-display">{plan.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono italic">Renewal Cycle: {plan.period}</span>
                      </div>
                      <span className="text-sm font-black text-slate-800 font-display">₦{plan.price.toLocaleString()}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Sports Betting Account Funding */
            <div className="flex flex-col gap-4">
              {/* Choose Betting Provider */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Select Sports Betting Bookmaker Provider
                </label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {BETTING_PROVIDERS.map((bet) => (
                    <button
                      key={bet.id}
                      id={`betting-provider-choice-${bet.id}`}
                      type="button"
                      onClick={() => {
                        setSelectedBettingId(bet.id);
                        setValidatedBettingClass(null);
                      }}
                      className={`relative p-3 border-2 rounded-xl text-center font-display font-bold text-xs transition-all active:scale-95 cursor-pointer ${
                        selectedBettingId === bet.id
                          ? 'border-emerald-600 bg-emerald-50/60 text-emerald-950 font-black shadow-sm'
                          : 'border-slate-100 bg-slate-50 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {bet.name}
                      {selectedBettingId === bet.id && (
                        <span className="absolute -top-1.5 -right-1.5 bg-emerald-600 border border-white text-white p-0.5 rounded-full">
                          <Check className="w-2.5 h-2.5 stroke-[3]" />
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Betting ID account verification */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Enter Player Account ID (User ID)
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-grow">
                    <input
                      id="betting-user-id-input"
                      type="text"
                      placeholder={BETTING_PROVIDERS.find(b => b.id === selectedBettingId)?.placeholder || 'Enter betting user id'}
                      value={bettingUserId}
                      onChange={(e) => {
                        setBettingUserId(e.target.value.replace(/[^0-9]/g, ''));
                        setValidatedBettingClass(null);
                      }}
                      className="w-full p-3.5 bg-slate-50 border border-slate-205 rounded-xl text-sm font-mono font-black tracking-widest pl-10 focus:bg-white focus:border-emerald-600 outline-none"
                      required
                    />
                    <Trophy className="absolute left-3.5 top-4 w-4 h-4 text-slate-400" />
                  </div>

                  <button
                    id="validate-betting-btn"
                    type="button"
                    onClick={handleValidateBetting}
                    disabled={isValidatingBetting}
                    className="px-4 bg-slate-900 text-white hover:bg-black rounded-xl text-xs font-bold font-display transition-colors active:scale-95 disabled:bg-slate-300 disabled:cursor-not-allowed flex items-center justify-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    {isValidatingBetting ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserCheck className="w-3.5 h-3.5" />
                    )}
                    Verify Account
                  </button>
                </div>
              </div>

              {/* Verified user profiles render */}
              {validatedBettingClass && validatedBettingClass.isValidated && (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-xl flex flex-col gap-1 text-xs shadow-inner animate-fade-in" id="betting-validation-box">
                  <span className="text-[10px] font-black text-emerald-800 tracking-wider font-display uppercase block">
                    Verified Sports Betting Registered Owner:
                  </span>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mt-1.5 text-slate-700 font-medium">
                    <div>
                      <span className="text-slate-450 text-[10px] block font-display">PLAYER OWNER'S NAME:</span>
                      <span className="text-emerald-950 font-bold font-display uppercase">{validatedBettingClass.customerName}</span>
                    </div>
                    <div>
                      <span className="text-slate-450 text-[10px] block font-display">ACCOUNT STATUS / TYPE:</span>
                      <span className="text-emerald-950 font-mono font-bold text-xs">{validatedBettingClass.status}</span>
                    </div>
                  </div>
                </div>
              )}

              {/* Betting Funding Amount */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">
                  Deposit Wallet Credit (₦)
                </label>
                <input
                  id="betting-recharge-amount"
                  type="number"
                  placeholder="Min N100 - Max N100,000"
                  min={100}
                  max={100000}
                  value={bettingAmount}
                  onChange={(e) => setBettingAmount(e.target.value)}
                  className="w-full p-3.5 bg-slate-50 border border-slate-205 rounded-xl font-display text-lg font-black tracking-tight outline-none focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all font-semibold"
                  required
                />
                <span className="text-[10px] text-slate-400 font-medium font-sans">Provides instant gateway dispatch via your Monnify active balance link. Zero convenience fee matches.</span>
              </div>
            </div>
          )}

          {/* Save beneficiaries setup */}
          <div className="border-t border-slate-100 pt-4 flex flex-col gap-3">
            <label className="relative flex items-center gap-2 cursor-pointer select-none">
              <input
                id="save-beneficiary-checkbox-bills"
                type="checkbox"
                checked={saveBeneficiary}
                onChange={(e) => setSaveBeneficiary(e.target.checked)}
                className="w-4.5 h-4.5 text-emerald-600 bg-slate-50 border-slate-205 rounded focus:ring-emerald-100"
              />
              <span className="text-xs font-bold text-slate-650 flex items-center gap-1 leading-normal">
                Save utility details to Saved Beneficiaries
              </span>
            </label>
 
            {saveBeneficiary && (
              <div className="flex flex-col gap-1.5" id="beneficiary-nickname-field-bills">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">Beneficiary Nickname</label>
                <input
                  id="beneficiary-name-input-bills"
                  type="text"
                  placeholder="e.g. Papa House Meter, My GOTV Bedroom, Office Abuja AEDC"
                  value={beneficiaryName}
                  onChange={(e) => setBeneficiaryName(e.target.value)}
                  className="w-full p-2.5 border border-slate-205 bg-slate-50 rounded-xl text-xs font-semibold focus:bg-white focus:border-emerald-505 outline-none"
                  required
                />
              </div>
            )}
          </div>

          {/* Submit Action Button */}
          <button
            id="bills-submit-btn"
            type="submit"
            className="w-full py-4 text-white font-bold bg-slate-900 hover:bg-black rounded-xl text-sm font-display transition-all shadow-md active:scale-95 flex items-center justify-center gap-2 border border-slate-950"
          >
            <Lightbulb className="w-4 h-4 text-amber-300 animate-pulse" />
            {activeTab === 'electricity' 
              ? `Pay ₦${electricAmount ? (parseFloat(electricAmount) + 100).toLocaleString() : '0'} for Prepaid Token (incl N100 Fee)` 
              : `Renew Cable TV Bouquet Bouquet Plan`
            }
          </button>
        </form>

        {/* Right checklist card logs */}
        <div className="flex flex-col gap-6">
          {/* Beneficiary list */}
          <div className="bg-slate-50 border border-slate-100 rounded-2xl p-5">
            <BeneficiarySelector
              beneficiaries={beneficiaries}
              onSelect={handleSelectBeneficiary}
              activeType={activeTab === 'electricity' ? 'meter' : 'iuc'}
              label={activeTab === 'electricity' ? 'Saved Meters' : 'Saved Decoders'}
            />
          </div>

          {/* Bill info card */}
          <div className="bg-gradient-to-br from-indigo-900 to-indigo-950 text-white rounded-2xl p-5 flex flex-col gap-4">
            <div className="p-2.5 bg-white/10 rounded-xl max-w-max border border-white/5 text-amber-400">
              <Sparkles className="w-5 h-5 animate-spin" />
            </div>

            <div>
              <h3 className="font-display font-black text-xs uppercase tracking-wider text-white mb-1.5">
                Billing Validation Protocols
              </h3>
              <p className="text-[11px] text-indigo-200 leading-relaxed font-semibold">
                To eliminate wrong inputs, our backend system validates target credentials prior to final checkout. If your account is not verified, please check the digits or use other saved accounts.
              </p>
            </div>

            <div className="text-[10px] text-indigo-300 font-mono flex flex-col gap-1 border-t border-white/10 pt-3">
              <span>● IKEDC, EKEDC, AEDC supported</span>
              <span>● DSTV, GOTV & Startimes live updates</span>
              <span>● 24/7 uninterrupted system availability</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
