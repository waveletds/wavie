import React, { useState, useEffect } from 'react';
import { 
  Users, TrendingUp, Coins, Search, ShieldCheck, CheckCircle2, 
  XCircle, AlertCircle, Filter, RefreshCw, UserCheck, 
  ChevronRight, PlusCircle, MinusCircle, Loader2, Award
} from 'lucide-react';
import { UserState, Transaction } from '../types';

interface AdminTerminalProps {
  currentUser: UserState;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onRefreshUserData: () => void;
}

export function AdminTerminal({ currentUser, addToast, onRefreshUserData }: AdminTerminalProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'users' | 'transactions'>('users');

  // Search and filter states
  const [userSearchText, setUserSearchText] = useState<string>('');
  const [txSearchText, setTxSearchText] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Action states
  const [selectedUser, setSelectedUser] = useState<any | null>(null);
  const [isAdjustmentModalOpen, setIsAdjustmentModalOpen] = useState<boolean>(false);
  const [adjustmentAction, setAdjustmentAction] = useState<'add' | 'deduct'>('add');
  const [adjustmentAmount, setAdjustmentAmount] = useState<string>('');
  const [isSubmittingAdjustment, setIsSubmittingAdjustment] = useState<boolean>(false);

  const [isKycModalOpen, setIsKycModalOpen] = useState<boolean>(false);
  const [selectedKycLevel, setSelectedKycLevel] = useState<string>('Tier 1');
  const [isSubmittingKyc, setIsSubmittingKyc] = useState<boolean>(false);

  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState<boolean>(false);
  const [selectedStatusVal, setSelectedStatusVal] = useState<string>('success');
  const [isSubmittingStatus, setIsSubmittingStatus] = useState<boolean>(false);

  // Fetch admin stats
  const fetchRegistryData = async () => {
    setIsLoading(true);
    try {
      // Fetch Users
      const usersRes = await fetch(`/api/admin/users?requesterEmail=${encodeURIComponent(currentUser.email)}`, {
        headers: {
          'x-requester-email': currentUser.email,
          'Accept': 'application/json'
        }
      });
      const usersData = await usersRes.json();
      if (usersRes.ok && usersData.success) {
        setUsers(usersData.users || []);
      } else {
        addToast(usersData.error || 'Failed to fetch directory users.', 'error');
      }

      // Fetch Global Transactions
      const txRes = await fetch(`/api/admin/transactions?requesterEmail=${encodeURIComponent(currentUser.email)}`, {
        headers: {
          'x-requester-email': currentUser.email,
          'Accept': 'application/json'
        }
      });
      const txData = await txRes.json();
      if (txRes.ok && txData.success) {
        setTransactions(txData.transactions || []);
      } else {
        addToast(txData.error || 'Failed to load transaction data.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Communication Error: ${err.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRegistryData();
  }, [currentUser.email]);

  // Handle balance adjustment
  const handlePerformAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const amountNum = parseFloat(adjustmentAmount);
    if (isNaN(amountNum) || amountNum <= 0) {
      addToast('Please enter a valid positive adjustment amount', 'warning');
      return;
    }

    setIsSubmittingAdjustment(true);
    try {
      const response = await fetch('/api/admin/user/wallet-balance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          userEmail: selectedUser.email,
          action: adjustmentAction,
          amount: amountNum
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        addToast(data.message || 'Balance adjusted successfully!', 'success');
        setIsAdjustmentModalOpen(false);
        setAdjustmentAmount('');
        fetchRegistryData();
        if (selectedUser.email === currentUser.email) {
          onRefreshUserData();
        }
      } else {
        addToast(data.error || 'Adjustment failed.', 'error');
      }
    } catch (err: any) {
      addToast(`Error performing wallet adjustment: ${err.message}`, 'error');
    } finally {
      setIsSubmittingAdjustment(false);
    }
  };

  // Handle KYC modification
  const handlePerformKycUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    setIsSubmittingKyc(true);
    try {
      const response = await fetch('/api/admin/user/kyc-level', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          userEmail: selectedUser.email,
          kycLevel: selectedKycLevel
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        addToast(data.message || 'KYC status updated!', 'success');
        setIsKycModalOpen(false);
        fetchRegistryData();
        if (selectedUser.email === currentUser.email) {
          onRefreshUserData();
        }
      } else {
        addToast(data.error || 'KYC update failed.', 'error');
      }
    } catch (err: any) {
      addToast(`Error updating KYC level: ${err.message}`, 'error');
    } finally {
      setIsSubmittingKyc(false);
    }
  };

  // Handle transaction status override
  const handlePerformStatusUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTx) return;

    setIsSubmittingStatus(true);
    try {
      const response = await fetch('/api/admin/transaction/update-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          transactionId: selectedTx.id,
          status: selectedStatusVal
        })
      });

      const data = await response.json();
      if (response.ok && data.success) {
        addToast(data.message || 'Transaction status updated!', 'success');
        setIsStatusModalOpen(false);
        fetchRegistryData();
        onRefreshUserData();
      } else {
        addToast(data.error || 'Status update failed.', 'error');
      }
    } catch (err: any) {
      addToast(`Error updating status: ${err.message}`, 'error');
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Calculated variables
  const totalBalanceInRegistry = users.reduce((acc, u) => acc + (u.walletBalance || 0), 0);
  const totalSuccessTxs = transactions.filter(t => t.status === 'success');
  const totalTxValue = totalSuccessTxs.reduce((acc, t) => acc + t.amount, 0);

  // Filters
  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(userSearchText.toLowerCase()) ||
    user.email.toLowerCase().includes(userSearchText.toLowerCase()) ||
    user.phone.includes(userSearchText)
  );

  const filteredTxs = transactions.filter(tx => {
    const matchesSearch = tx.recipient.includes(txSearchText) || 
                          tx.reference.toLowerCase().includes(txSearchText.toLowerCase()) ||
                          tx.description.toLowerCase().includes(txSearchText.toLowerCase());
    const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto" id="admin-dashboard-container">
      {/* HEADER WITH STATS SUMMARY */}
      <div className="bg-slate-900 border border-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-sm flex flex-col gap-6 relative overflow-hidden" id="admin-summary-badge">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <ShieldCheck className="w-48 h-48 stroke-[1.5]" />
        </div>
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
              <h1 className="font-display font-black text-xs uppercase tracking-widest text-[#B5F5D3]">System Control Panel</h1>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight mt-1">PORTAL EXECUTIVE TERMINAL</h2>
            <p className="text-xs text-slate-400 font-sans mt-0.5 max-w-md">
              Secure terminal authorized for role <span className="font-bold text-slate-200 capitalize">[{currentUser.role}]</span>. You have access to user accounting ledger modification, system telemetries, and instant transaction remediation.
            </p>
          </div>
          <button
            onClick={fetchRegistryData}
            disabled={isLoading}
            className="px-4 py-2 bg-white/15 hover:bg-white/20 active:scale-95 text-xs text-white font-extrabold font-display rounded-xl flex items-center gap-1.5 transition-all w-fit cursor-pointer self-start sm:self-center disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Sync Ledger
          </button>
        </div>

        {/* METRICS ROW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4" id="admin-telemetry-metrics-grid">
          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-display">Global Registry Users</span>
              <span className="text-xl sm:text-2xl font-black font-mono leading-none tracking-tight">{users.length}</span>
            </div>
            <div className="p-2.5 bg-rose-500/15 border border-rose-500/30 text-rose-400 rounded-xl">
              <Users className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-display">System Vault Holdings</span>
              <span className="text-xl sm:text-2xl font-black font-mono leading-none tracking-tight text-emerald-400">₦{totalBalanceInRegistry.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 rounded-xl">
              <Coins className="w-5 h-5" />
            </div>
          </div>

          <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-black text-slate-400 tracking-wider uppercase font-display">Processed Success Volume</span>
              <span className="text-xl sm:text-2xl font-black font-mono leading-none tracking-tight text-[#c691f5]">₦{totalTxValue.toLocaleString()}</span>
            </div>
            <div className="p-2.5 bg-violet-500/15 border border-violet-500/30 text-violet-400 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
        </div>
      </div>

      {/* VIEW SELECTOR */}
      <div className="flex border-b border-slate-200 gap-1 mt-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-5 py-3 text-xs font-bold font-display tracking-wider uppercase relative ${
            activeTab === 'users' ? 'text-slate-900 border-b-2 border-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          User Registry ({users.length})
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`px-5 py-3 text-xs font-bold font-display tracking-wider uppercase relative ${
            activeTab === 'transactions' ? 'text-slate-900 border-b-2 border-slate-900 font-extrabold' : 'text-slate-400 hover:text-slate-700'
          }`}
        >
          All System Transactions ({transactions.length})
        </button>
      </div>

      {/* CORE ADMIN CONTENT */}
      <div>
        {isLoading ? (
          <div className="p-16 border border-slate-205 rounded-3xl bg-white flex flex-col items-center justify-center text-center text-slate-400 gap-3">
            <Loader2 className="w-8 h-8 text-rose-500 animate-spin" />
            <span className="text-xs font-bold uppercase tracking-wider">Retrieving Secure Database Logs...</span>
          </div>
        ) : activeTab === 'users' ? (
          <div className="flex flex-col gap-4">
            {/* USER SEARCH BAR */}
            <div className="bg-white p-4 border border-slate-101 shadow-sm rounded-2xl flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search user by email, absolute phone number, or name..."
                  value={userSearchText}
                  onChange={(e) => setUserSearchText(e.target.value)}
                  className="w-full p-2.5 pl-9 border border-slate-205 text-xs bg-slate-50 focus:bg-white rounded-xl outline-none"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              <div className="text-[10px] font-bold text-slate-400 font-mono self-center">
                Displaying {filteredUsers.length} of {users.length} registered profiles
              </div>
            </div>

            {/* USERS CARD TABLE */}
            <div className="bg-white border border-slate-101 shadow-sm rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-101 text-[10px] font-black uppercase text-slate-455 font-display tracking-widest">
                      <th className="py-3.5 px-6">Identified Client</th>
                      <th className="py-3.5 px-6 text-center">Security Level</th>
                      <th className="py-3.5 px-6 text-right">Wallet Balance</th>
                      <th className="py-3.5 px-6 text-center">Biometrics</th>
                      <th className="py-3.5 px-6 text-center">Internal PIN</th>
                      <th className="py-3.5 px-6 text-right">Override Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-101 text-xs">
                    {filteredUsers.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                          No matching profiles in database registry
                        </td>
                      </tr>
                    ) : (
                      filteredUsers.map((u) => (
                        <tr key={u.email} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-4 px-6 flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 flex items-center gap-1.5 leading-snug">
                              {u.name}
                              {u.role === 'super_admin' ? (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-violet-150 text-violet-750 border border-violet-200 rounded uppercase tracking-wider">Super Admin</span>
                              ) : u.role === 'admin' ? (
                                <span className="text-[9px] font-black px-1.5 py-0.5 bg-rose-150 text-rose-750 border border-rose-200 rounded uppercase tracking-wider">Admin</span>
                              ) : null}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono leading-none">{u.email}</span>
                            <span className="text-[10px] text-slate-400 font-mono leading-none">{u.phone}</span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`text-[10px] font-extrabold font-display uppercase tracking-wider px-2.5 py-0.5 border rounded-full ${
                              u.kycLevel === 'Tier 3' ? 'bg-[#E1F8EB] text-[#13633C] border-[#B5F5D3]' :
                              u.kycLevel === 'Tier 2' ? 'bg-[#E1F1F8] text-[#134663] border-[#B5E1F5]' :
                              'bg-slate-100 text-slate-600 border-slate-200'
                            }`}>
                              {u.kycLevel}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-extrabold text-slate-800">
                            ₦{(u.walletBalance || 0).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-center font-mono">
                            <span className={`text-[10px] font-bold ${u.isWebAuthnEnabled ? 'text-emerald-600' : 'text-slate-400'}`}>
                              {u.isWebAuthnEnabled ? 'Yes / TouchID' : 'Disabled'}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center font-mono text-slate-600 font-bold tracking-wider">
                            {u.transactionPin}
                          </td>
                          <td className="py-4 px-6 text-right">
                            <div className="flex items-center gap-1.5 justify-end">
                              {/* Adjust wallet */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setAdjustmentAction('add');
                                  setAdjustmentAmount('');
                                  setIsAdjustmentModalOpen(true);
                                }}
                                className="p-1.5 bg-emerald-50 border border-emerald-100 hover:bg-emerald-100 text-emerald-700 rounded-lg text-[10px] font-bold font-display flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                title="Adjust Balance Account"
                              >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Balance
                              </button>

                              {/* Upgrade KYC */}
                              <button
                                onClick={() => {
                                  setSelectedUser(u);
                                  setSelectedKycLevel(u.kycLevel);
                                  setIsKycModalOpen(true);
                                }}
                                className="p-1.5 bg-indigo-50 border border-indigo-100 hover:bg-indigo-110 text-indigo-700 rounded-lg text-[10px] font-bold font-display flex items-center gap-1 active:scale-95 transition-all cursor-pointer"
                                title="Modify Verification Limits"
                              >
                                <Award className="w-3.5 h-3.5" />
                                KYC
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {/* TX SEARCH/FILTER BAR */}
            <div className="bg-white p-4 border border-slate-101 shadow-sm rounded-2xl flex flex-col md:flex-row md:items-center gap-3">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Search global transaction registry by reference key, recipient phone, or description..."
                  value={txSearchText}
                  onChange={(e) => setTxSearchText(e.target.value)}
                  className="w-full p-2.5 pl-9 border border-slate-205 text-xs bg-slate-50 focus:bg-white rounded-xl outline-none"
                />
                <Search className="absolute left-3.5 top-3.5 w-4 h-4 text-slate-400" />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black text-slate-455 uppercase tracking-wider block font-display shrink-0">Filter Status:</span>
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="p-2 border border-slate-205 text-xs rounded-xl bg-slate-50 outline-none"
                >
                  <option value="all">All Registries</option>
                  <option value="success">Success</option>
                  <option value="pending">Pending</option>
                  <option value="failed">Failed</option>
                </select>
              </div>
            </div>

            {/* TRANSACTIONS Card Table */}
            <div className="bg-white border border-slate-101 shadow-sm rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-101 text-[10px] font-black uppercase text-slate-455 font-display tracking-widest">
                      <th className="py-3.5 px-6">Transaction ID / Reference</th>
                      <th className="py-3.5 px-6">Identified Owner</th>
                      <th className="py-3.5 px-6">Type</th>
                      <th className="py-3.5 px-6">Date / Timestamp</th>
                      <th className="py-3.5 px-6 text-right">Processed Value</th>
                      <th className="py-3.5 px-6 text-center">Status</th>
                      <th className="py-3.5 px-6 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-101 text-xs">
                    {filteredTxs.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-12 text-center text-slate-400 font-bold uppercase tracking-wider">
                          No matching transactions in database registry
                        </td>
                      </tr>
                    ) : (
                      filteredTxs.map((t) => (
                        <tr key={t.id} className="hover:bg-slate-50/50 transition-all">
                          <td className="py-4 px-6 flex flex-col gap-0.5">
                            <span className="font-bold text-slate-800 flex items-center gap-1">{t.reference}</span>
                            <span className="text-[9px] text-slate-400 font-mono truncate max-w-[120px]">{t.id}</span>
                            <span className="text-[10px] leading-tight text-slate-400 font-sans max-w-[200px] truncate" title={t.description}>
                              {t.description}
                            </span>
                          </td>
                          <td className="py-4 px-6 font-mono text-slate-500 font-bold">
                            {t.recipient}
                          </td>
                          <td className="py-4 px-6 uppercase font-extrabold font-display text-[10px] text-slate-600 tracking-wider">
                            {t.type}
                          </td>
                          <td className="py-4 px-6 text-slate-400 font-mono text-[10px]">
                            {new Date(t.timestamp).toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-right font-mono font-extrabold text-slate-800">
                            ₦{t.amount.toLocaleString()}
                          </td>
                          <td className="py-4 px-6 text-center">
                            <span className={`text-[9px] font-black px-2.5 py-0.5 rounded-full border uppercase tracking-wider ${
                              t.status === 'success' ? 'bg-[#E1F8EB] text-[#13633C] border-[#B5F5D3]' :
                              t.status === 'pending' ? 'bg-[#FFF8E6] text-[#6E430B] border-[#FFECB5]' :
                              'bg-[#FAECE6] text-[#862512] border-[#F7C6B5]'
                            }`}>
                              {t.status}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-right">
                            <button
                              onClick={() => {
                                setSelectedTx(t);
                                setSelectedStatusVal(t.status);
                                setIsStatusModalOpen(true);
                              }}
                              className="px-2 py-1.5 bg-slate-100 ring-1 ring-slate-200 hover:bg-slate-205 text-slate-800 rounded-lg text-[10px] font-bold font-display active:scale-95 transition-all cursor-pointer inline-flex items-center gap-1"
                            >
                              Sync Status
                              <ChevronRight className="w-3 h-3 text-slate-400" />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* BALANCE ADJUSTMENT ACTION MODAL */}
      {isAdjustmentModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-101 shadow-lg max-w-md w-full p-6 flex flex-col gap-5 select-none animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-wide uppercase">
                Wallet Override Balance
              </h3>
              <button
                onClick={() => setIsAdjustmentModalOpen(false)}
                className="p-1 px-2.5 text-slate-400 hover:text-slate-800 font-sans text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] leading-relaxed text-slate-500">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-455">Owner:</span>
                <span className="font-extrabold text-slate-800">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-455">Email:</span>
                <span className="font-extrabold text-slate-800 font-mono">{selectedUser.email}</span>
              </div>
              <div className="flex justify-between items-center mt-1 border-t border-slate-100 pt-1.5">
                <span className="font-semibold text-slate-455">Current Balance:</span>
                <span className="font-extrabold text-[#111] font-mono">₦{selectedUser.walletBalance.toLocaleString()}</span>
              </div>
            </div>

            <form onSubmit={handlePerformAdjustment} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block font-display">Adjustment Action Type</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setAdjustmentAction('add')}
                    className={`p-2.5 rounded-xl border text-xs font-bold font-display flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                      adjustmentAction === 'add'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-800 font-black shadow-sm'
                        : 'bg-white border-slate-205 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <PlusCircle className="w-4 h-4 text-emerald-600" />
                    Credit Wallet
                  </button>
                  <button
                    type="button"
                    onClick={() => setAdjustmentAction('deduct')}
                    className={`p-2.5 rounded-xl border text-xs font-bold font-display flex items-center justify-center gap-1.5 transition-all outline-none cursor-pointer ${
                      adjustmentAction === 'deduct'
                        ? 'bg-red-50 border-red-550 text-red-800 font-black shadow-sm'
                        : 'bg-white border-slate-205 text-slate-500 hover:bg-slate-50'
                    }`}
                  >
                    <MinusCircle className="w-4 h-4 text-red-600" />
                    Debit Wallet
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block font-display">Override Amount (₦)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={adjustmentAmount}
                  onChange={(e) => setAdjustmentAmount(e.target.value)}
                  className="w-full p-2.5 border border-slate-205 text-xs font-mono bg-slate-50 focus:bg-white rounded-xl outline-none font-bold"
                  required
                  min="1"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingAdjustment}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold font-display rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingAdjustment ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Dispatching Ledger Override...
                    </>
                  ) : 'Confirm Transaction Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* KYC UPGRADE ACTION MODAL */}
      {isKycModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-101 shadow-lg max-w-sm w-full p-6 flex flex-col gap-5 select-none animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-wide uppercase">
                Modify KYC Integrity Limit
              </h3>
              <button
                onClick={() => setIsKycModalOpen(false)}
                className="p-1 px-2.5 text-slate-400 hover:text-slate-800 font-sans text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] leading-relaxed text-slate-500">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-455">Owner:</span>
                <span className="font-extrabold text-slate-800">{selectedUser.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-455">Current KYC:</span>
                <span className="font-black text-indigo-700">{selectedUser.kycLevel}</span>
              </div>
            </div>

            <form onSubmit={handlePerformKycUpdate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block font-display">Target Identity Level</label>
                <select
                  value={selectedKycLevel}
                  onChange={(e) => setSelectedKycLevel(e.target.value)}
                  className="w-full p-2.5 border border-slate-205 text-xs rounded-xl bg-slate-50 outline-none font-bold"
                >
                  <option value="Basic">Basic (Limit: ₦5,000)</option>
                  <option value="Tier 1">Tier 1 (Limit: ₦50,000)</option>
                  <option value="Tier 2">Tier 2 (Limit: ₦200,000)</option>
                  <option value="Tier 3">Tier 3 (Uncapped / Executive)</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingKyc}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold font-display rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingKyc ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Saving New Status...
                    </>
                  ) : 'Apply Verification Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TRANSACTION OVERRIDE STATUS MODAL */}
      {isStatusModalOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-101 shadow-lg max-w-sm w-full p-6 flex flex-col gap-5 select-none animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-wide uppercase flex items-center gap-1 text-slate-800">
                Remediate Transaction Status
              </h3>
              <button
                onClick={() => setIsStatusModalOpen(false)}
                className="p-1 px-2.5 text-slate-400 hover:text-slate-800 font-sans text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] leading-relaxed text-slate-500">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-455">Reference ID:</span>
                <span className="font-extrabold text-slate-800 font-mono">{selectedTx.reference}</span>
              </div>
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-455">Description:</span>
                <span className="font-bold text-slate-800 text-right">{selectedTx.description}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-455">Current Status:</span>
                <span className={`text-[10px] uppercase font-black tracking-wider px-2 py-0.5 border rounded-full ${
                  selectedTx.status === 'success' ? 'bg-[#E1F8EB] text-[#13633C] border-[#B5F5D3]' :
                  selectedTx.status === 'pending' ? 'bg-[#FFF8E6] text-[#6E430B] border-[#FFECB5]' :
                  'bg-[#FAECE6] text-[#862512] border-[#F7C6B5]'
                }`}>
                  {selectedTx.status}
                </span>
              </div>
            </div>

            <form onSubmit={handlePerformStatusUpdate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block font-display">Forced Status Mapping</label>
                <select
                  value={selectedStatusVal}
                  onChange={(e) => setSelectedStatusVal(e.target.value)}
                  className="w-full p-2.5 border border-slate-205 text-xs rounded-xl bg-slate-50 outline-none font-bold"
                >
                  <option value="success">Success / Settled</option>
                  <option value="pending">Pending Processing</option>
                  <option value="failed">Failed / Aborted</option>
                </select>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isSubmittingStatus}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold font-display rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isSubmittingStatus ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Executing Protocol Override...
                    </>
                  ) : 'Override System Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
