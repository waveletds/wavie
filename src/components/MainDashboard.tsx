import React, { useState } from 'react';
import {   Wallet, ArrowDownLeft, ArrowUpRight, ArrowRight, Phone, 
  Lightbulb, Tv, GraduationCap, Copy, Users, ChevronRight, Zap, RefreshCw,
  Sunrise, Sun, Moon
} from 'lucide-react';
import { UserState, Transaction, SavedBeneficiary, ActiveTab, Language } from '../types';
import { PIDGIN_DICT, ENGLISH_DICT } from '../data';
import { BeneficiarySelector } from './BeneficiarySelector';

interface MainDashboardProps {
  user: UserState;
  recentTransactions: Transaction[];
  beneficiaries: SavedBeneficiary[];
  onNavigate: (tab: ActiveTab) => void;
  lang: Language;
  onOpenReceipt: (tx: Transaction) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const MainDashboard: React.FC<MainDashboardProps> = ({
  user,
  recentTransactions,
  beneficiaries,
  onNavigate,
  lang,
  onOpenReceipt,
  addToast,
}) => {
  const dict = lang === 'pidgin' ? PIDGIN_DICT : ENGLISH_DICT;
  const [copiedCode, setCopiedCode] = useState<boolean>(false);

  // Time of Day Dynamic Greetings (Morning, Afternoon, Evening)
  const getGreetingTuple = () => {
    const hour = new Date().getHours();
    if (hour >= 0 && hour < 12) {
      return {
        text: lang === 'pidgin' ? 'Good morning' : 'Good Morning',
        icon: <Sunrise className="w-5 h-5 text-amber-500 animate-bounce-slow" />
      };
    } else if (hour >= 12 && hour < 17) {
      return {
        text: lang === 'pidgin' ? 'Good afternoon' : 'Good Afternoon',
        icon: <Sun className="w-5 h-5 text-amber-400 animate-spin-slow" />
      };
    } else {
      return {
        text: lang === 'pidgin' ? 'Good evening' : 'Good Evening',
        icon: <Moon className="w-5 h-5 text-indigo-400" />
      };
    }
  };

  const greeting = getGreetingTuple();

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    addToast('Referral code copied successfully! Share to earn bonus.', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const serviceIcons = {
    airtime: { icon: <Phone className="w-5 h-5" />, label: dict.airtime, tab: 'airtime', desc: lang === 'pidgin' ? 'Call credit sharp' : 'Cheap refills' },
    data: { icon: <Phone className="w-5 h-5" />, label: dict.data, tab: 'data', desc: lang === 'pidgin' ? 'Cheap SME plans' : 'High speed internet' },
    electricity: { icon: <Lightbulb className="w-5 h-5" />, label: dict.electricity, tab: 'electricity', desc: lang === 'pidgin' ? 'Nepa electricity' : 'Prepaid & Postpaid' },
    cable: { icon: <Tv className="w-5 h-5" />, label: dict.cable, tab: 'cable', desc: lang === 'pidgin' ? 'MultiChoice decoder' : 'DStv & GOtv instant' },
    education: { icon: <GraduationCap className="w-5 h-5" />, label: dict.education, tab: 'education', desc: lang === 'pidgin' ? 'WAEC, NECO pins' : 'Result ePIN check' },
  };

  const getTxTypeStyles = (type: string) => {
    switch (type) {
      case 'funding':
        return { bg: 'bg-emerald-50 text-emerald-600', sign: '+' };
      case 'referral_bonus':
        return { bg: 'bg-emerald-50 text-emerald-600', sign: '+' };
      case 'cashback':
        return { bg: 'bg-emerald-50 text-emerald-600', sign: '+' };
      case 'withdrawal':
        return { bg: 'bg-amber-50 text-amber-600', sign: '-' };
      default:
        return { bg: 'bg-slate-100 text-slate-700', sign: '-' };
    }
  };

  const promos = [
    { text: lang === 'pidgin' ? 'Glo promo: cashback up to 3% on credit!' : 'Glo Mega Cashback: Enjoy 3% off airtime immediately!', code: 'GLO3', color: 'from-green-600 to-emerald-500' },
    { text: lang === 'pidgin' ? 'WAEC Exam pin dey hot! Instant WhatsApp download.' : 'WAEC 2026 PINs Available: Active serial key issuance.', code: 'WAEC26', color: 'from-blue-600 to-indigo-500' },
    { text: lang === 'pidgin' ? 'MTN SME plan drop! ₦235 for full 1GB!' : 'MTN SME Slash: Purchase 1GB SME data bundle at ₦235 flat!', code: 'SMEFLASH', color: 'from-amber-400 to-yellow-500 text-slate-900' }
  ];

  return (
    <div 
      className="flex flex-col gap-6 animate-fade-in-up" 
      id="dashboard-tab-view"
    >
      {/* Welcome Message banner */}
      <div 
        className="flex flex-col md:flex-row md:items-center justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-black font-display tracking-tight text-slate-900 flex items-center gap-2.5" id="welcome-text">
            {greeting.icon}
            <span>{greeting.text}, {user.name || 'Chief'}!</span>
          </h1>
          <p className="text-sm text-slate-400 font-medium ml-7.5">
            {lang === 'pidgin' ? 'Wetin you wan pay for today?' : 'Choose standard services with high success delivery rates.'}
          </p>
        </div>

        {/* KYC display */}
        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 text-xs font-semibold text-slate-600">
          <span className="w-2 h-2 rounded-full bg-emerald-600 animate-pulse" />
          <span className="font-display">KYC: {user.kycLevel}</span>
        </div>
      </div>

      {/* Wallet Balance Board */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Wallet Display Card */}
        <div className="md:col-span-2 relative overflow-hidden bg-slate-900 text-white rounded-2xl p-6 shadow-xl flex flex-col justify-between group">
          {/* Subtle design circles */}
          <div className="absolute -right-10 -top-10 w-40 h-40 bg-emerald-600/10 rounded-full blur-2xl group-hover:bg-emerald-600/20 transition-all duration-300" />
          <div className="absolute -left-10 -bottom-10 w-32 h-32 bg-emerald-600/5 rounded-full blur-xl" />

          <div className="flex justify-between items-start z-10">
            <div className="flex flex-col">
              <span className="text-xs text-slate-400 font-display font-medium uppercase tracking-widest">
                Main Balance
              </span>
              <span className="text-3xl md:text-4xl font-extrabold font-display mt-2 flex items-baseline gap-1" id="balance-amount">
                ₦{user.walletBalance.toLocaleString('en-NG')}
                <span className="text-xs font-mono font-medium text-slate-400">.00 (Wallet ID/No: {user.phone})</span>
              </span>
            </div>
            <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-md">
              <Wallet className="w-6 h-6 text-slate-300" />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 mt-8 z-10 pt-2 border-t border-white/5">
            <button
              id="dashboard-deposit-btn"
              onClick={() => onNavigate('wallet')}
              className="flex-grow py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl text-xs font-display flex items-center justify-center gap-2 transition-all shadow active:scale-95 cursor-pointer"
            >
              <ArrowDownLeft className="w-4 h-4 text-slate-900 transition-transform" />
              Deposit
            </button>
            <button
              id="dashboard-transfer-btn"
              onClick={() => onNavigate('wallet')}
              className="flex-grow py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold font-display flex items-center justify-center gap-2 backdrop-blur-md border border-white/15 transition-all active:scale-95 cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4 text-slate-300" />
              Transfer
            </button>
          </div>
        </div>

        {/* Promo and mini info block */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col justify-between">
          <div className="flex flex-col">
            <div className="inline-flex py-1.5 px-2.5 bg-amber-50 text-amber-700 text-[10px] font-extrabold font-display rounded-lg max-w-max uppercase tracking-wider gap-1 items-center">
              <Zap className="w-3.5 h-3.5 animate-bounce" />
              {dict.cashback_tag}
            </div>
            <p className="text-sm text-slate-500 mt-3 leading-relaxed">
              {lang === 'pidgin' 
                ? 'Buy airtime/data credit for yourself or any family and get instant cashback straight to your main wallet account.' 
                : 'Purchase discount telecom packages directly using automated routes, retaining margins within your virtual wallet.'}
            </p>
          </div>

          <div className="flex items-center gap-3 pt-4 border-t border-slate-50 mt-4">
            <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center font-bold text-indigo-600 font-display">
              {user.referredCount}
            </div>
            <div className="flex flex-col">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">{dict.referred_label}</span>
              <span className="text-sm font-bold text-slate-800 font-display">₦{user.referralEarnings.toLocaleString('en-NG')} {lang === 'pidgin' ? 'Earned' : 'Cashbacks'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Promotional Scrolling Banners */}
      <div 
        className="flex gap-4 overflow-x-auto pb-1.5 no-scrollbar select-none"
      >
        {promos.map((promo, idx) => (
          <div 
            key={idx} 
            className={`flex-shrink-0 p-4 rounded-xl bg-gradient-to-r ${promo.color} text-white flex flex-col justify-between border shadow-sm cursor-grab active:cursor-grabbing hover:-translate-y-0.5 hover:scale-[1.01] transition-all duration-200`}
            style={{ width: '280px', height: '110px' }}
          >
            <span className="text-xs font-semibold leading-snug font-display">{promo.text}</span>
            <div className="flex items-center justify-between border-t border-white/10 pt-1.5 mt-2">
              <span className="text-[9px] uppercase tracking-widest font-bold opacity-80">PROMO CODE: {promo.code}</span>
              <span className="text-[10px] font-bold bg-white/20 px-1.5 py-0.5 rounded-full select-none">ACTIVE</span>
            </div>
          </div>
        ))}
      </div>

      {/* Primary Products Grid */}
      <div className="flex flex-col gap-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display" id="services-title">
          {dict.quick_actions_header}
        </h2>
        
        <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-5 gap-3 sm:gap-4">
          {Object.entries(serviceIcons).map(([key, item]) => {
            const serviceColors: Record<string, { bg: string, text: string, hoverBg: string }> = {
              airtime: { bg: 'bg-blue-50', text: 'text-blue-600', hoverBg: 'group-hover:bg-blue-600 group-hover:text-white' },
              data: { bg: 'bg-purple-50', text: 'text-purple-600', hoverBg: 'group-hover:bg-purple-600 group-hover:text-white' },
              electricity: { bg: 'bg-yellow-50', text: 'text-yellow-600', hoverBg: 'group-hover:bg-yellow-600 group-hover:text-white' },
              cable: { bg: 'bg-red-50', text: 'text-red-500', hoverBg: 'group-hover:bg-red-500 group-hover:text-white' },
              education: { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-600 group-hover:text-white' },
            };
            const colors = serviceColors[key] || { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-600 group-hover:text-white' };

            return (
              <button
                key={key}
                id={`quick-action-tab-${item.tab}`}
                onClick={() => onNavigate(item.tab as ActiveTab)}
                className="bg-white p-3.5 sm:p-4 rounded-xl sm:rounded-2xl border border-slate-200 hover:border-emerald-500 hover:-translate-y-1 hover:scale-[1.02] active:scale-95 cursor-pointer flex flex-col items-center justify-center gap-2 group transition-all duration-200 text-center shadow-sm hover:shadow-md select-none"
              >
                <div className={`w-11 h-11 sm:w-12 sm:h-12 ${colors.bg} ${colors.text} rounded-xl flex items-center justify-center ${colors.hoverBg} transition-all duration-300`}>
                  {item.icon}
                </div>
                <span className="font-display font-bold text-slate-800 text-xs sm:text-sm mt-1 transition-colors group-hover:text-emerald-600">
                  {item.label}
                </span>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium truncate w-full px-1">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Saved Beneficiaries Slider */}
      <div className="bg-slate-50/50 rounded-2xl p-4 border border-slate-105">
        <BeneficiarySelector
          beneficiaries={beneficiaries}
          onSelect={(b) => {
            onNavigate(b.type === 'phone' ? 'airtime' : b.type === 'meter' ? 'electricity' : 'cable');
            addToast(`Selected beneficiary ${b.name}. Re-navigating.`, 'info');
          }}
          activeType="all"
          label={dict.saved_beneficiaries}
        />
      </div>

      {/* Dual Layout: Recent Transactions + Referral Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions component */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-450 uppercase tracking-wider font-display">
              {dict.recent_activities_header}
            </h2>
            <button
              id="view-all-tx-btn-dashboard"
              onClick={() => onNavigate('transactions')}
              className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-0.5 group cursor-pointer"
            >
              See Full Web Logs
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            {recentTransactions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-6 text-center text-slate-400">
                <Wallet className="w-10 h-10 opacity-30 stroke-[1.5] mb-2" />
                <span className="text-xs font-medium">You have not completed any transaction yet.</span>
              </div>
            ) : (
              recentTransactions.slice(0, 4).map((tx) => {
                const style = getTxTypeStyles(tx.type);
                return (
                  <button
                    key={tx.id}
                    id={`recent-tx-row-${tx.id}`}
                    onClick={() => onOpenReceipt(tx)}
                    className="w-full flex items-center justify-between p-3 bg-slate-50 hover:bg-slate-100/85 border border-slate-100 hover:border-slate-200 rounded-xl transition-all text-left focus:outline-none cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-full font-bold text-sm flex items-center justify-center font-display ${style.bg}`}>
                        {tx.type === 'electricity' ? <Lightbulb className="w-4 h-4" /> :
                         tx.type === 'cable' ? <Tv className="w-4 h-4" /> :
                         style.sign}
                      </div>

                      <div className="flex flex-col min-w-0">
                        <span className="text-xs font-bold text-slate-800 font-display truncate">
                          {tx.description}
                        </span>
                        <span className="text-[10px] text-slate-400 mt-0.5 font-mono">
                          Ref: {tx.reference} • {new Date(tx.timestamp).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col items-end flex-shrink-0">
                      <span className={`text-xs font-extrabold font-display ${style.sign === '+' ? 'text-emerald-600' : 'text-slate-800'}`}>
                        {style.sign}₦{tx.amount.toLocaleString()}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                        tx.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </div>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Dynamic Referral Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden group">
          {/* Subtle patterns */}
          <div className="absolute -right-12 -bottom-12 w-32 h-32 bg-white/5 rounded-full blur-xl group-hover:scale-110 transition-transform duration-500" />
          
          <div className="flex flex-col z-10">
            <div className="p-3 bg-white/10 rounded-xl max-w-max backdrop-blur-md mb-4 border border-white/10">
              <Users className="w-5 h-5 text-emerald-400" />
            </div>

            <h3 className="font-display font-bold text-lg tracking-tight">
              {dict.referral_card_title}
            </h3>
            <p className="text-xs text-slate-350 mt-2 leading-relaxed">
              {dict.referral_card_body}
            </p>
          </div>

          <div className="mt-8 z-10">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase mb-1.5">
              YOUR PERSONAL INVITE CODE
            </span>
            <div className="flex items-center gap-1.5 bg-white/10 border border-white/10 p-2.5 rounded-xl backdrop-blur-md">
              <span className="font-mono font-bold text-sm tracking-widest text-emerald-300 select-all flex-grow p-1">
                {user.referralCode}
              </span>
              <button
                id="copy-referral-code-btn"
                onClick={handleCopyReferral}
                className="p-1 px-2.5 bg-emerald-500 text-slate-900 rounded-lg text-xs font-bold font-display hover:bg-emerald-450 flex items-center gap-1 transition-colors active:scale-95 whitespace-nowrap cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                {copiedCode ? 'Copied' : 'Copy'}
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-2 text-center italic">
              ⚡ {lang === 'pidgin' ? 'Share coded, both of you collect ₦505 each!' : 'Both you and your referred friend get credited instantly.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
