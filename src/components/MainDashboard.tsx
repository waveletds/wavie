import React, { useState } from 'react';
import {   Wallet, ArrowDownLeft, ArrowUpRight, ArrowRight, Phone, 
  Lightbulb, Tv, GraduationCap, Copy, Users, ChevronRight, Zap, RefreshCw,
  Sunrise, Sun, Moon, Share2
} from 'lucide-react';
import { UserState, Transaction, SavedBeneficiary, ActiveTab, Language } from '../types';
import { PIDGIN_DICT, ENGLISH_DICT } from '../data';
import { BeneficiarySelector } from './BeneficiarySelector';
import { motion } from 'motion/react';

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

  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  const handleCopyReferral = () => {
    navigator.clipboard.writeText(user.referralCode);
    setCopiedCode(true);
    addToast('Referral code copied successfully! Share to earn bonus.', 'success');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCopyInviteLink = () => {
    const link = `${window.location.origin}${window.location.pathname}?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    addToast('Special landing invite link copied! Share this link for auto-filled login commissions.', 'success');
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const serviceIcons = {
    airtime: { icon: <Phone className="w-4.5 h-4.5" />, label: dict.airtime, tab: 'airtime', desc: lang === 'pidgin' ? 'Call credit sharp' : 'Cheap refills' },
    data: { icon: <RefreshCw className="w-4.5 h-4.5" />, label: dict.data, tab: 'data', desc: lang === 'pidgin' ? 'SME data bundle' : 'High speed internet' },
    electricity: { icon: <Lightbulb className="w-4.5 h-4.5" />, label: dict.electricity, tab: 'electricity', desc: lang === 'pidgin' ? 'Nepa electricity' : 'Prepaid billing' },
    cable: { icon: <Tv className="w-4.5 h-4.5" />, label: dict.cable, tab: 'cable', desc: lang === 'pidgin' ? 'Decoder subscription' : 'DStv & GOtv' },
    education: { icon: <GraduationCap className="w-4.5 h-4.5" />, label: dict.education, tab: 'education', desc: lang === 'pidgin' ? 'WAEC, NECO pins' : 'Result ePIN check' },
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



  return (
    <div 
      className="flex flex-col gap-6" 
      id="dashboard-tab-view"
    >
      {/* Welcome Message banner */}
      <motion.div 
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
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
      </motion.div>

      {/* Wallet Balance Board */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05, ease: 'easeOut' }}
        className="w-full"
        id="wallet-board"
      >
        {/* Wallet Display Card - Premium Luxury Silk Theme Card */}
        <div className="relative overflow-hidden bg-slate-900 text-white rounded-[2rem] p-7 border border-white/[0.04] shadow-[0_24px_50px_-12px_rgba(15,23,42,0.18)] flex flex-col justify-between group transition-all duration-300 hover:shadow-[0_28px_60px_-10px_rgba(15,23,42,0.25)] hover:border-emerald-500/20">
          {/* Subtle design circles with high dynamic organic flow */}
          <div className="absolute -right-12 -top-12 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl group-hover:bg-emerald-500/15 group-hover:scale-110 transition-all duration-700 pointer-events-none" />
          <div className="absolute -left-12 -bottom-12 w-36 h-36 bg-amber-500/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex justify-between items-start z-10">
            <div className="flex flex-col">
              <span className="text-[10px] sm:text-xs text-slate-450 font-display font-black uppercase tracking-widest leading-none">
                Main Wallet Balance
              </span>
              <span className="text-3xl md:text-4xl font-black font-display mt-3.5 flex items-baseline gap-1" id="balance-amount">
                ₦{user.walletBalance.toLocaleString('en-NG')}
                <span className="text-xs font-mono font-medium text-emerald-400">.00</span>
              </span>
            </div>
            <div className="p-3 bg-white/[0.06] border border-white/[0.06] rounded-2xl backdrop-blur-xl shrink-0">
              <Wallet className="w-5 h-5 text-emerald-400" />
            </div>
          </div>

          {/* Deposit / Transfer action buttons with elite transitions */}
          <div className="grid grid-cols-2 gap-4 mt-8 z-10 pt-4 border-t border-white/10">
            <motion.button
              id="dashboard-deposit-btn"
              onClick={() => onNavigate('wallet')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 bg-emerald-500 hover:bg-emerald-450 hover:shadow-emerald-500/15 text-slate-950 font-bold rounded-xl text-xs sm:text-sm font-display flex items-center justify-center gap-2.5 transition-all shadow-lg cursor-pointer group"
            >
              <ArrowDownLeft className="w-4 h-4 text-slate-950 transition-transform duration-300 group-hover:translate-y-0.5 group-hover:-translate-x-0.5" />
              Deposit
            </motion.button>
            <motion.button
              id="dashboard-transfer-btn"
              onClick={() => onNavigate('wallet')}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-3 bg-white/5 hover:bg-white/10 border border-white/15 hover:border-white/30 text-white rounded-xl text-xs sm:text-sm font-bold font-display flex items-center justify-center gap-2.5 backdrop-blur-md transition-all cursor-pointer group"
            >
              <ArrowUpRight className="w-4 h-4 text-slate-300 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              Transfer
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* Primary Products Grid */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.15, ease: 'easeOut' }}
        className="flex flex-col gap-3"
      >
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest font-display" id="services-title">
          {dict.quick_actions_header}
        </h2>
        
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 sm:gap-3">
          {Object.entries(serviceIcons).map(([key, item]) => {
            const serviceColors: Record<string, { bg: string, text: string, hoverBg: string }> = {
              airtime: { bg: 'bg-indigo-50 border border-indigo-100/50', text: 'text-indigo-600', hoverBg: 'group-hover:bg-indigo-650 group-hover:text-white' },
              data: { bg: 'bg-emerald-50 border border-emerald-100/50', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-650 group-hover:text-white' },
              electricity: { bg: 'bg-amber-50 border border-amber-100/50', text: 'text-amber-600', hoverBg: 'group-hover:bg-amber-500 group-hover:text-white' },
              cable: { bg: 'bg-rose-50 border border-rose-100/50', text: 'text-rose-600', hoverBg: 'group-hover:bg-rose-500 group-hover:text-white' },
              education: { bg: 'bg-sky-50 border border-sky-100/50', text: 'text-sky-600', hoverBg: 'group-hover:bg-sky-650 group-hover:text-white' },
            };
            const colors = serviceColors[key] || { bg: 'bg-emerald-50', text: 'text-emerald-600', hoverBg: 'group-hover:bg-emerald-650 group-hover:text-white' };

            return (
              <button
                key={key}
                id={`quick-action-tab-${item.tab}`}
                onClick={() => onNavigate(item.tab as ActiveTab)}
                className="bg-white/80 backdrop-blur-md p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border border-[#E5E2DA]/60 hover:border-emerald-500 hover:bg-white hover:-translate-y-0.5 max-sm:active:scale-95 sm:hover:scale-[1.02] cursor-pointer flex flex-col items-center justify-center gap-1.5 group transition-all duration-300 text-center shadow-[0_4px_12px_rgba(115,108,92,0.01)] hover:shadow-[0_12px_28px_rgba(115,108,92,0.06)] select-none overflow-hidden"
              >
                <div className={`w-9 h-9 sm:w-11 sm:h-11 ${colors.bg} ${colors.text} rounded-full flex items-center justify-center ${colors.hoverBg} transition-all duration-300 shadow-sm scale-95 group-hover:scale-100`}>
                  {item.icon}
                </div>
                <span className="font-display font-black text-slate-800 text-[10px] sm:text-xs mt-0.5 transition-colors group-hover:text-emerald-600 truncate w-full px-0.5 select-none leading-tight">
                  {item.label}
                </span>
                <p className="hidden xs:block text-[8px] sm:text-[9px] text-slate-400 mt-0 font-medium truncate w-full px-0.5 pointer-events-none select-none">
                  {item.desc}
                </p>
              </button>
            );
          })}
        </div>
      </motion.div>

      {/* Saved Beneficiaries Slider */}
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.2, ease: 'easeOut' }}
        className="bg-slate-50/50 rounded-2xl p-4 border border-slate-105"
      >
        <BeneficiarySelector
          beneficiaries={beneficiaries}
          onSelect={(b) => {
            onNavigate(b.type === 'phone' ? 'airtime' : b.type === 'meter' ? 'electricity' : 'cable');
            addToast(`Selected beneficiary ${b.name}. Re-navigating.`, 'info');
          }}
          activeType="all"
          label={dict.saved_beneficiaries}
        />
      </motion.div>

      {/* Dual Layout: Recent Transactions + Referral Banner */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions component */}
        <motion.div 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, delay: 0.25, ease: 'easeOut' }}
          className="lg:col-span-2 bg-white rounded-2xl border border-slate-100 shadow-sm p-6 flex flex-col gap-4"
        >
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
        </motion.div>

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

          <div className="mt-8 z-10 flex flex-col gap-3">
            <div>
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
                  className="p-1.5 px-3 bg-emerald-500 hover:bg-emerald-450 text-slate-900 rounded-lg text-xs font-bold font-display flex items-center gap-1 transition-all active:scale-95 whitespace-nowrap cursor-pointer shadow-sm"
                >
                  <Copy className="w-3.5 h-3.5" />
                  {copiedCode ? 'Copied!' : 'Copy Code'}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-bold text-slate-400 tracking-wider block uppercase mb-1.5">
                SHARE SPECIAL LANDING LINK
              </span>
              <button
                id="copy-special-referral-link-btn"
                onClick={handleCopyInviteLink}
                className="w-full py-2.5 bg-white/10 border border-white/10 hover:bg-white/15 text-white hover:text-emerald-300 rounded-xl text-xs font-bold font-display transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer backdrop-blur-md"
              >
                <Copy className="w-3.5 h-3.5" />
                {copiedLink ? 'Copied Invitation Link!' : 'Copy Direct Share Link'}
              </button>
            </div>
            
            <p className="text-[10px] text-slate-400 mt-2 text-center italic">
              ⚡ {lang === 'pidgin' ? 'Share coded or link, both of you collect ₦100 welcome activation reward!' : 'Both you and your referred friend get credited instantly upon registration.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
