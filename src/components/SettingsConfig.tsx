import React, { useState } from 'react';
import { 
  Languages, Eye, EyeOff, ShieldCheck, Mail, Phone, 
  MapPin, ShieldPlus, ChevronRight, User, Key, KeyRound, Sparkles
} from 'lucide-react';
import { UserState, Language, KYCLevel } from '../types';

interface SettingsConfigProps {
  user: UserState;
  onUpdateUser: (updatedFields: Partial<UserState>) => void;
  lang: Language;
  onChangeLang: (newLang: Language) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const SettingsConfig: React.FC<SettingsConfigProps> = ({
  user,
  onUpdateUser,
  lang,
  onChangeLang,
  addToast,
}) => {
  // Profile settings
  const [profileName, setProfileName] = useState<string>(user.name);
  const [profileEmail, setProfileEmail] = useState<string>(user.email);
  const [profilePhone, setProfilePhone] = useState<string>(user.phone);

  // Security pin controls
  const [currentPinInput, setCurrentPinInput] = useState<string>('');
  const [newPinInput, setNewPinInput] = useState<string>('');
  const [confirmPinInput, setConfirmPinInput] = useState<string>('');
  const [isChangingPin, setIsChangingPin] = useState<boolean>(false);

  // KYC levels submission
  const [kycBvn, setKycBvn] = useState<string>('');
  const [selectedKycTargetLevel, setSelectedKycTargetLevel] = useState<KYCLevel>('Tier 1');
  const [isUpgradingKyc, setIsUpgradingKyc] = useState<boolean>(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!profileName.trim()) {
      addToast('Profile name cannot be blank.', 'error');
      return;
    }
    if (!profileEmail.includes('@')) {
      addToast('Please enter a valid email address.', 'error');
      return;
    }
    if (profilePhone.length < 11) {
      addToast('Please enter an 11-digit WhatsApp phone number.', 'error');
      return;
    }

    onUpdateUser({
      name: profileName.trim(),
      email: profileEmail.trim(),
      phone: profilePhone.trim(),
    });
    addToast('Profile particulars saved successfully!', 'success');
  };

  const handleUpdatePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (user.isPinSet && currentPinInput !== user.transactionPin) {
      addToast('The current security PIN has been entered incorrectly.', 'error');
      return;
    }

    if (!/^[0-9]{4}$/.test(newPinInput)) {
      addToast('Your new PIN must be exactly 4 digits.', 'error');
      return;
    }

    if (newPinInput !== confirmPinInput) {
      addToast('The new PINs do not match each other.', 'error');
      return;
    }

    onUpdateUser({
      transactionPin: newPinInput,
      isPinSet: true,
    });

    addToast(user.isPinSet ? 'Transaction PIN updated successfully!' : 'Security PIN configured successfully!', 'success');
    setCurrentPinInput('');
    setNewPinInput('');
    setConfirmPinInput('');
    setIsChangingPin(false);
  };

  const handleKycUpgradeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedKycTargetLevel === user.kycLevel) {
      addToast(`You are already validated at ${user.kycLevel}.`, 'info');
      return;
    }

    if (kycBvn.length < 11) {
      addToast('Please enter a valid 11-digit Bank Verification Number (BVN).', 'error');
      return;
    }

    setIsUpgradingKyc(true);
    addToast('Verifying BVN compliance registers with Central Bank registry...', 'info');

    setTimeout(() => {
      setIsUpgradingKyc(false);
      onUpdateUser({
        kycLevel: selectedKycTargetLevel,
      });
      addToast(`KYC successfully escalated! High-value transactional limit is active now!`, 'success');
      setKycBvn('');
    }, 1800);
  };

  const kycRequirements = {
    'Tier 1': { limit: '₦50,000', req: 'Basic Phone & Name Registration only' },
    'Tier 2': { limit: '₦1,000,000', req: 'Requires BVN Registration (Escalate limit immediately)' },
    'Tier 3': { limit: '₦10,000,000', req: 'Utility Proof proof (reseller status authorized)' }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6" id="settings-feature-config">
      {/* Profile & Language Configuration */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-6">
        <div>
          <h3 className="font-display font-black text-slate-800 text-sm">Account & Language Settings</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium font-sans">Toggle Pidgin dialogues or rewrite profile listings.</p>
        </div>

        {/* Language Multi option Toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display flex items-center gap-1.5">
            <Languages className="w-4 h-4 text-emerald-600" />
            Active Platform Voice
          </label>
          <div className="grid grid-cols-2 gap-2 bg-slate-100 p-1 rounded-xl">
            <button
              id="language-english-btn"
              type="button"
              onClick={() => {
                onChangeLang('english');
                addToast('System vocal parameters set to English.', 'info');
              }}
              className={`py-2 text-xs font-bold font-display rounded-lg transition-all ${
                lang === 'english'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              English Professional
            </button>
            <button
              id="language-pidgin-btn"
              type="button"
              onClick={() => {
                onChangeLang('pidgin');
                addToast('System voice set to Nigerian Pidgin!', 'success');
              }}
              className={`py-2 text-xs font-bold font-display rounded-lg transition-all ${
                lang === 'pidgin'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'text-slate-550 hover:text-slate-800'
              }`}
            >
              Naija Pidgin 🇳🇬
            </button>
          </div>
        </div>

        {/* Profile Details Editing form */}
        <form onSubmit={handleSaveProfile} className="flex flex-col gap-4 border-t border-slate-50 pt-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Wallet Title Account Holder</span>
            <div className="relative">
              <input
                id="profile-name-input"
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full p-2.5 pl-9 border border-slate-205 rounded-xl text-xs font-semibold focus:bg-white outline-none"
                required
              />
              <User className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Receipt Dispatch email</span>
            <div className="relative">
              <input
                id="profile-email-input"
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                className="w-full p-2.5 pl-9 border border-slate-250 rounded-xl text-xs font-semibold focus:bg-white outline-none"
                required
              />
              <Mail className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Registered phone line</span>
            <div className="relative">
              <input
                id="profile-phone-input"
                type="text"
                value={profilePhone}
                onChange={(e) => setProfilePhone(e.target.value.replace(/[^0-9]/g, ''))}
                className="w-full p-2.5 pl-9 border border-slate-250 rounded-xl text-xs font-semibold focus:bg-white outline-none font-mono"
                maxLength={11}
                required
              />
              <Phone className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
            </div>
          </div>

          <button
            id="profile-save-btn"
            type="submit"
            className="w-full py-2.5 text-xs font-bold font-display text-white bg-slate-900 border border-slate-950 hover:bg-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            Save Account Details
          </button>
        </form>
      </div>

      {/* Transaction security settings */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-5">
        <div>
          <h3 className="font-display font-black text-slate-800 text-sm">Security & Checkout PIN</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium">Re-write or establish security code credentials.</p>
        </div>

        <form onSubmit={handleUpdatePin} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider font-display">Wallet Pin Access</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                user.isPinSet ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
              }`}>
                {user.isPinSet ? '🔒 High-Security Active' : '🔓 PIN Not Configured'}
              </span>
            </div>
          </div>

          {user.isPinSet && (
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold text-slate-405 block uppercase">Enter Current Secure PIN (4 digits)</label>
              <div className="relative">
                <input
                  id="settings-pin-current"
                  type="password"
                  placeholder="••••"
                  value={currentPinInput}
                  onChange={(e) => setCurrentPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                  maxLength={4}
                  className="w-full p-2.5 pl-9 border border-slate-205 text-sm font-mono bg-slate-50 focus:bg-white text-center font-bold tracking-widest outline-none rounded-xl"
                  required
                />
                <Key className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-405 block uppercase">New Secure 4-Digit PIN</label>
            <div className="relative">
              <input
                id="settings-pin-new"
                type="password"
                placeholder="••••"
                value={newPinInput}
                onChange={(e) => setNewPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={4}
                className="w-full p-2.5 pl-9 border border-slate-205 text-sm font-mono bg-slate-50 focus:bg-white text-center font-bold tracking-widest outline-none rounded-xl"
                required
              />
              <KeyRound className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-405" />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[10px] font-bold text-slate-450 block uppercase">Verify PIN Entry</label>
            <div className="relative">
              <input
                id="settings-pin-confirm"
                type="password"
                placeholder="••••"
                value={confirmPinInput}
                onChange={(e) => setConfirmPinInput(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={4}
                className="w-full p-2.5 pl-9 border border-slate-205 text-sm font-mono bg-slate-50 focus:bg-white text-center font-bold tracking-widest outline-none rounded-xl"
                required
              />
              <ShieldCheck className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-405" />
            </div>
          </div>

          <button
            id="settings-pin-submit"
            type="submit"
            className="w-full py-2.5 mt-2 text-xs font-bold font-display text-white bg-slate-900 border border-slate-950 hover:bg-black rounded-xl transition-all shadow-sm flex items-center justify-center gap-1.5"
          >
            {user.isPinSet ? 'Save Changed Security PIN' : 'Activate 4-Digit Security PIN'}
          </button>
        </form>
      </div>

      {/* KYC Compliance upgrading panel */}
      <div className="bg-white rounded-2xl border border-slate-101 shadow-sm p-6 flex flex-col gap-5">
        <div>
          <h3 className="font-display font-black text-slate-800 text-sm">Fintech Compliance Upgrade</h3>
          <p className="text-[11px] text-slate-400 mt-0.5 font-medium font-sans">Escalate daily limits is required for high-volume traders.</p>
        </div>

        <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-xl text-xs flex justify-between items-center font-display shadow-inner">
          <span className="font-bold text-slate-550">Active KYC Verified:</span>
          <span className="text-slate-900 font-extrabold bg-emerald-50 border border-emerald-150 text-emerald-700 px-3 py-1 rounded-full text-xs">
            {user.kycLevel}
          </span>
        </div>

        <form onSubmit={handleKycUpgradeSubmit} className="flex flex-col gap-4 border-t border-slate-50 pt-4">
          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider font-display">Select Target Escalate Level</span>
            <div className="grid grid-cols-2 gap-2">
              {(['Tier 2', 'Tier 3'] as const).map((lv) => (
                <button
                  key={lv}
                  id={`kyc-select-${lv.replace(/\s/g, '-')}`}
                  type="button"
                  onClick={() => setSelectedKycTargetLevel(lv)}
                  className={`py-2 text-xs font-bold font-display border rounded-xl transition-all ${
                    selectedKycTargetLevel === lv
                      ? 'border-emerald-505 bg-emerald-50/50 font-black text-emerald-900'
                      : 'border-slate-150 bg-white text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {lv} ({lv === 'Tier 2' ? '₦1M' : '₦10M'} Limit)
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-bold text-slate-450 uppercase tracking-wider font-display">Bank Verification Number (BVN)</span>
            <div className="relative">
              <input
                id="kyc-bvn-input"
                type="text"
                placeholder="2223 4567 890 (11 digits)"
                value={kycBvn}
                onChange={(e) => setKycBvn(e.target.value.replace(/[^0-9]/g, ''))}
                maxLength={11}
                className="w-full p-2.5 pl-9 border border-slate-250 bg-slate-50 focus:bg-white rounded-xl text-xs font-mono font-bold tracking-widest outline-none"
                required
              />
              <ShieldPlus className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-450" />
            </div>
          </div>

          <button
            id="kyc-upgrade-submit-btn"
            type="submit"
            disabled={isUpgradingKyc}
            className="w-full py-2.5 bg-slate-900 border border-slate-950 hover:bg-black text-white text-xs font-bold font-display rounded-xl flex items-center justify-center gap-1.5 shadow shadow-sm hover:shadow active:scale-95 disabled:bg-slate-350"
          >
            {isUpgradingKyc ? 'Completing KYC check...' : 'Verify & Upgrade Account'}
          </button>
        </form>

        <div className="text-[10px] bg-amber-50 text-amber-800 border border-amber-100 p-3 rounded-xl flex items-start gap-1.5 font-medium leading-normal">
          <Sparkles className="w-3.5 h-3.5 mt-0.5 text-amber-500 flex-shrink-0 animate-ping" />
          <span>
            <strong>Reseller Advantage:</strong> Elevating to Tier 3 activates continuous high volume transactions with 0% convenience fee surcharge on all WAEC/NECO pins.
          </span>
        </div>
      </div>
    </div>
  );
};
