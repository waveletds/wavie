import React, { useState } from 'react';
import { 
  Search, ShieldEllipsis, Filter, Smartphone, Lightbulb, Tv, 
  GraduationCap, TrendingUp, TrendingDown, Sparkles, ExternalLink, Calendar, Receipt
} from 'lucide-react';
import { Transaction, TransactionType } from '../types';

interface TransactionsListProps {
  transactions: Transaction[];
  onOpenReceipt: (tx: Transaction) => void;
  addToast: (msg: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const TransactionsList: React.FC<TransactionsListProps> = ({
  transactions,
  onOpenReceipt,
  addToast,
}) => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<'all' | 'recharges' | 'bills' | 'education' | 'funding' | 'withdrawal'>('all');

  // Stats calculators
  const statsDeposits = transactions
    .filter((t) => t.type === 'funding' && t.status === 'success')
    .reduce((acc, t) => acc + t.amount, 0);

  const statsWithdrawals = transactions
    .filter((t) => t.type === 'withdrawal' && t.status === 'success')
    .reduce((acc, t) => acc + t.amount, 0);

  const statsSpending = transactions
    .filter((t) => ['airtime', 'data', 'electricity', 'cable', 'education'].includes(t.type) && t.status === 'success')
    .reduce((acc, t) => acc + t.amount, 0);

  const statsFeedbackCashback = transactions
    .filter((t) => (t.type === 'cashback' || t.type === 'referral_bonus') && t.status === 'success')
    .reduce((acc, t) => acc + t.amount, 0);

  // Dynamic filter matching handler
  const matchesFilter = (tx: Transaction) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'recharges') return tx.type === 'airtime' || tx.type === 'data';
    if (activeFilter === 'bills') return tx.type === 'electricity' || tx.type === 'cable';
    if (activeFilter === 'education') return tx.type === 'education';
    if (activeFilter === 'funding') return tx.type === 'funding' || tx.type === 'referral_bonus' || tx.type === 'cashback';
    if (activeFilter === 'withdrawal') return tx.type === 'withdrawal';
    return true;
  };

  // Search filter matching handler
  const matchesSearch = (tx: Transaction) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      tx.description.toLowerCase().includes(q) ||
      tx.reference.toLowerCase().includes(q) ||
      tx.recipient.toLowerCase().includes(q) ||
      tx.id.toLowerCase().includes(q)
    );
  };

  const filtered = transactions.filter((tx) => matchesFilter(tx) && matchesSearch(tx));

  const getIcon = (type: string) => {
    switch (type) {
      case 'airtime':
      case 'data':
        return <Smartphone className="w-4 h-4 text-emerald-600" />;
      case 'electricity':
        return <Lightbulb className="w-4 h-4 text-amber-500" />;
      case 'cable':
        return <Tv className="w-4 h-4 text-rose-500" />;
      case 'education':
        return <GraduationCap className="w-4 h-4 text-emerald-600" />;
      case 'funding':
      case 'referral_bonus':
      case 'cashback':
        return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'withdrawal':
        return <TrendingDown className="w-4 h-4 text-amber-600" />;
      default:
        return <Receipt className="w-4 h-4 text-slate-500" />;
    }
  };

  return (
    <div className="flex flex-col gap-6" id="history-transactions-list">
      {/* Upper overview metrics header */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Money Loaded */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-emerald-50 text-emerald-700 rounded-xl">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Deposited Cash</span>
            <span className="text-base font-black font-display text-slate-800">
              ₦{statsDeposits.toLocaleString('en-NG')}
            </span>
          </div>
        </div>

        {/* Total Spending */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-slate-100 text-slate-700 rounded-xl">
            <TrendingDown className="w-5 h-5 animate-pulse" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Spent value</span>
            <span className="text-base font-black font-display text-slate-800">
              ₦{statsSpending.toLocaleString('en-NG')}
            </span>
          </div>
        </div>

        {/* Withdrawal Cash-Out */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-amber-50 text-amber-700 rounded-xl">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Cash-out bank</span>
            <span className="text-base font-black font-display text-slate-800">
              ₦{statsWithdrawals.toLocaleString('en-NG')}
            </span>
          </div>
        </div>

        {/* Earned Cashback & Referral Reward */}
        <div className="bg-white border border-slate-100 p-4 rounded-2xl flex items-center gap-3.5 shadow-sm">
          <div className="p-3 bg-pink-50 text-pink-700 rounded-xl">
            <Sparkles className="w-5 h-5 animate-spin" style={{ animationDuration: '6s' }} />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wide">Free Cashback Bonus</span>
            <span className="text-base font-black font-display text-pink-700">
              +₦{statsFeedbackCashback.toLocaleString('en-NG')}
            </span>
          </div>
        </div>
      </div>

      {/* Audit utilities filters and search */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
        {/* Tab filters switcher */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0 no-scrollbar">
          {(['all', 'recharges', 'bills', 'education', 'funding', 'withdrawal'] as const).map((filterName) => (
            <button
              key={filterName}
              id={`history-filter-tab-${filterName}`}
              onClick={() => setActiveFilter(filterName)}
              className={`px-3.5 py-1.5 text-xs font-bold font-display rounded-lg capitalize whitespace-nowrap transition-all ${
                activeFilter === filterName
                  ? 'bg-slate-900 border border-slate-900 text-white'
                  : 'bg-slate-50 text-slate-500 hover:text-slate-800 border border-slate-100 hover:border-slate-205'
              }`}
            >
              {filterName === 'all' ? 'All records' : filterName}
            </button>
          ))}
        </div>

        {/* Search Input bar */}
        <div className="relative w-full md:w-72">
          <input
            id="history-search-input"
            type="text"
            placeholder="Search reference, phone, disco..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full p-2.5 pl-9 border border-slate-200 bg-slate-50 text-xs font-semibold rounded-xl outline-none focus:bg-white focus:border-emerald-500 transition-all font-sans"
          />
          <Search className="absolute left-3 top-3 w-4.5 h-4.5 text-slate-400" />
        </div>
      </div>

      {/* Main Records List frame */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between border-b border-slate-50 pb-2">
          <span className="text-xs font-bold text-slate-400 uppercase font-display select-none">Audit list</span>
          <span className="text-[10px] bg-slate-100 text-emerald-650 px-2 py-0.5 rounded-full font-bold">
            {filtered.length} Transformed Matches
          </span>
        </div>

        <div className="flex flex-col gap-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center text-slate-400">
              <Calendar className="w-12 h-12 opacity-25 stroke-[1.5] mb-2" />
              <span className="text-xs font-semibold">No records match your query filters.</span>
              <p className="text-[10px] text-slate-400 mt-0.5 font-medium leading-normal">Try clearing search parameters or trying default categories.</p>
            </div>
          ) : (
            filtered.map((tx) => {
              const sign = ['funding', 'referral_bonus', 'cashback'].includes(tx.type) ? '+' : '-';
              return (
                <button
                  key={tx.id}
                  id={`history-tx-card-${tx.id}`}
                  onClick={() => onOpenReceipt(tx)}
                  className="w-full p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 hover:border-emerald-200 rounded-xl transition-all text-left flex items-center justify-between outline-none group"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2.5 bg-white border border-slate-100 rounded-xl group-hover:shadow-sm transition-all text-slate-700">
                      {getIcon(tx.type)}
                    </div>

                    <div className="flex flex-col min-w-0">
                      <span className="text-xs font-bold text-slate-800 font-display truncate pr-2">
                        {tx.description}
                      </span>
                      <div className="flex items-center gap-1.5 mt-0.5 text-[9px] text-slate-400 font-mono">
                        <span className="bg-slate-100/80 px-1 rounded uppercase tracking-wider font-semibold border text-[8px]">{tx.type}</span>
                        <span>Reference: {tx.reference}</span>
                        <span>•</span>
                        <span>{new Date(tx.timestamp).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 flex-shrink-0">
                    <div className="flex flex-col items-end">
                      <span className={`text-xs font-extrabold font-display ${sign === '+' ? 'text-emerald-600' : 'text-slate-850'}`}>
                        {sign}₦{tx.amount.toLocaleString()}
                      </span>
                      <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full mt-1 ${
                        tx.status === 'success' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.status}
                      </span>
                    </div>

                    <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600 transition-colors" />
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
