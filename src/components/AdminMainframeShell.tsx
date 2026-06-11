import React, { useState, useEffect } from 'react';
import { 
  Users, KeyRound, ShieldAlert, Cpu, Check, AlertTriangle, 
  Search, ShieldCheck, Mail, Phone, Loader2, Save, Play, RefreshCw, 
  Settings, LogOut, FileText, ChevronRight, TrendingUp, Coins, Sparkles, Activity
} from 'lucide-react';
import { UserState } from '../types';
import { AdminTerminal } from './AdminTerminal';
import { SuperAdminConsole } from './SuperAdminConsole';

interface AdminMainframeShellProps {
  currentUser: UserState;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onRefreshUserData: () => void;
  onExitAdmin: () => void;
}

export function AdminMainframeShell({ 
  currentUser, 
  addToast, 
  onRefreshUserData, 
  onExitAdmin 
}: AdminMainframeShellProps) {
  const [activeSubTab, setActiveSubTab] = useState<'users' | 'transactions' | 'gateways' | 'roles' | 'system_logs'>('users');
  const [serverStatus, setServerStatus] = useState<'nominal' | 'checking'>('nominal');
  const [latencyVal, setLatencyVal] = useState<number>(45);
  const [sysTime, setSysTime] = useState<string>(new Date().toLocaleTimeString());

  // Real-time ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSysTime(new Date().toLocaleTimeString());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePingRefresh = () => {
    setServerStatus('checking');
    setTimeout(() => {
      setLatencyVal(Math.floor(Math.random() * 80) + 30);
      setServerStatus('nominal');
      addToast('Gateway connection pool validated successfully.', 'success');
    }, 605);
  };

  const isSuperAdmin = currentUser.role === 'super_admin';

  return (
    <div className="min-h-screen bg-[#070A13] text-[#E2E8F0] font-mono selection:bg-rose-500 selection:text-white relative overflow-hidden flex flex-col" id="admin-mainframe-portal">
      {/* High tech abstract background grids */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:32px_32px] opacity-20 pointer-events-none" />
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[50%] rounded-full bg-violet-900/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-rose-950/10 blur-[140px] pointer-events-none" />

      {/* TOP HEADLINER SECURITY PANEL */}
      <header className="border-b border-white/5 bg-[#0A0E1A]/95 p-4 sm:px-6 flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-rose-600 via-[#8A3FFC] to-indigo-600 p-0.5 flex items-center justify-center shadow-lg shadow-rose-950/30">
            <div className="w-full h-full rounded-[10px] bg-[#070A13] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5 text-rose-500 animate-pulse" />
            </div>
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5 leading-none">
              <span className="text-[10px] uppercase font-black tracking-widest text-rose-500 font-sans">Corporate Security Frame</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            </div>
            <h1 className="text-sm font-black text-white uppercase tracking-tight flex items-center gap-1.5 mt-0.5 font-sans">
              WAVIE ADMINISTRATIVE CONSOLE <span className="text-xs bg-rose-500/15 border border-rose-500/20 text-rose-400 px-2 py-0.5 rounded uppercase font-mono font-bold">STRICT SYSTEM ONLY</span>
            </h1>
          </div>
        </div>

        {/* METRICS SUMMARY STRIP */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[10px] md:justify-end">
          <div className="bg-[#0e1627] border border-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-slate-400">DATABASE INTEGRITY:</span>
            <span className="text-emerald-400 font-bold">SQLITE ACTIVE (WAL)</span>
          </div>

          <div className="bg-[#0e1627] border border-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <Activity className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-slate-400">GATEWAY PING:</span>
            <button 
              onClick={handlePingRefresh}
              disabled={serverStatus === 'checking'}
              className="text-white hover:text-rose-400 underline font-bold cursor-pointer transition-colors"
            >
              {serverStatus === 'checking' ? 'PINGING...' : `${latencyVal}ms`}
            </button>
          </div>

          <div className="bg-[#0e1627] border border-white/5 rounded-lg px-3 py-1.5 flex items-center gap-2">
            <span className="text-slate-400">CORE TIME:</span>
            <span className="text-[#888] font-bold font-mono">{sysTime} UTC</span>
          </div>
        </div>
      </header>

      <div className="flex-grow flex flex-col lg:flex-row relative z-10 w-full">
        {/* SIDE BAR NAVIGATION ELEMENT - FULLY DARK MONOCHROME */}
        <aside className="lg:w-64 border-b lg:border-b-0 lg:border-r border-white/5 bg-[#090C16]/80 backdrop-blur-md p-4 sm:p-5 flex flex-col justify-between gap-6">
          <div className="flex flex-col gap-6">
            {/* Logged in admin account panel card */}
            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-full bg-rose-950 flex items-center justify-center font-bold text-rose-450 border border-rose-500/20 uppercase font-sans">
                {currentUser.name ? currentUser.name[0] : 'S'}
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-xs font-black text-white truncate leading-tight font-sans">{currentUser.name}</span>
                <span className="text-[9px] text-[#A0AEC0] truncate font-mono">{currentUser.email}</span>
                <span className="text-[8px] uppercase tracking-widest text-rose-500 font-bold mt-1 inline-block leading-none">
                  {currentUser.role === 'super_admin' ? '✪ SUPER ADMINISTRATOR' : '🛡️ DELEGATED ADMIN'}
                </span>
              </div>
            </div>

            {/* Side Navigation list */}
            <nav className="flex flex-col gap-1">
              <span className="text-[9px] text-[#4A5568] font-black uppercase tracking-widest px-2.5 mb-1.5">Operational Modules</span>
              
              <button
                onClick={() => setActiveSubTab('users')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border relative overflow-hidden cursor-pointer font-sans ${
                  activeSubTab === 'users'
                    ? 'bg-rose-500/10 text-rose-405 border-rose-500/20 font-black shadow-md shadow-rose-950/10'
                    : 'text-slate-400 hover:text-white border-transparent hover:bg-white/[0.02]'
                }`}
              >
                <Users className="w-4 h-4 text-rose-500" />
                User Profiles Directory
                {activeSubTab === 'users' && <span className="absolute right-0 top-0 bottom-0 w-1 bg-rose-500" />}
              </button>

              <button
                onClick={() => setActiveSubTab('transactions')}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border relative overflow-hidden cursor-pointer font-sans ${
                  activeSubTab === 'transactions'
                    ? 'bg-rose-500/10 text-rose-405 border-rose-500/20 font-black shadow-md shadow-rose-950/10'
                    : 'text-slate-400 hover:text-white border-transparent hover:bg-white/[0.02]'
                }`}
              >
                <FileText className="w-4 h-4 text-[#8A3FFC]" />
                System Audit Ledgers
                {activeSubTab === 'transactions' && <span className="absolute right-0 top-0 bottom-0 w-1 bg-rose-500" />}
              </button>

              {isSuperAdmin && (
                <>
                  <div className="h-px bg-white/5 my-2" />
                  <span className="text-[9px] text-[#4A5568] font-black uppercase tracking-widest px-2.5 mb-1.5">Authority Configuration</span>

                  <button
                    onClick={() => setActiveSubTab('gateways')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border relative overflow-hidden cursor-pointer font-sans ${
                      activeSubTab === 'gateways'
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 font-black shadow-md shadow-violet-950/10'
                        : 'text-slate-400 hover:text-white border-transparent hover:bg-white/[0.02]'
                    }`}
                  >
                    <KeyRound className="w-4 h-4 text-violet-500" />
                    Intermediary API Keys
                    {activeSubTab === 'gateways' && <span className="absolute right-0 top-0 bottom-0 w-1 bg-violet-500" />}
                  </button>

                  <button
                    onClick={() => setActiveSubTab('roles')}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all text-left border relative overflow-hidden cursor-pointer font-sans ${
                      activeSubTab === 'roles'
                        ? 'bg-violet-500/10 text-violet-400 border-violet-500/20 font-black shadow-md shadow-violet-950/10'
                        : 'text-slate-400 hover:text-white border-transparent hover:bg-white/[0.02]'
                    }`}
                  >
                    <ShieldCheck className="w-4 h-4 text-sky-400" />
                    Role Privileges Rules
                    {activeSubTab === 'roles' && <span className="absolute right-0 top-0 bottom-0 w-1 bg-violet-500" />}
                  </button>
                </>
              )}
            </nav>
          </div>

          <div className="flex flex-col gap-2 pt-4 border-t border-white/5">
            {/* Button to go to user module / workspace */}
            <button
              onClick={onExitAdmin}
              className="w-full py-2 px-3 bg-emerald-600/10 border border-emerald-500/15 hover:bg-emerald-600 text-emerald-400 hover:text-white transition-all text-[11px] font-black font-sans uppercase rounded-xl flex items-center justify-center gap-2 cursor-pointer shadow-md"
            >
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Exit to Wallet view
            </button>
          </div>
        </aside>

        {/* CONTENT STAGE WINDOW */}
        <main className="flex-grow p-4 sm:p-6 lg:p-8 overflow-y-auto max-h-[calc(100vh-80px)] no-scrollbar bg-[#080B14]">
          {/* Warn alert ticker */}
          <div className="mb-6 p-3 bg-red-950/15 border border-red-900/20 text-[10px] text-red-400 flex items-start gap-2.5 rounded-xl">
            <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span className="leading-snug">
              <strong>OFFICIAL SYSTEM USAGE ADVISORY:</strong> Access to this secure portal is cryptographically logged. All balance increments, KYC overriding, and credential mutations affect real production tables and client instances immediately.
            </span>
          </div>

          {/* LOAD THE CORRESPONDING ADMINISTRATIVE COMPONENT & DESIGN PARADIGM */}
          {activeSubTab === 'users' && (
            <div className="animate-fade-in">
              <AdminTerminal 
                currentUser={currentUser}
                addToast={addToast}
                onRefreshUserData={onRefreshUserData}
              />
            </div>
          )}

          {activeSubTab === 'transactions' && (
            <div className="animate-fade-in">
              {/* We invoke AdminTerminal but default its internal tab to transactions by custom-styling or let the component render its own */}
              <AdminTerminal 
                currentUser={currentUser}
                addToast={addToast}
                onRefreshUserData={onRefreshUserData}
              />
            </div>
          )}

          {isSuperAdmin && activeSubTab === 'gateways' && (
            <div className="animate-fade-in">
              <SuperAdminConsole 
                currentUser={currentUser}
                addToast={addToast}
                onRefreshUserData={onRefreshUserData}
              />
            </div>
          )}

          {isSuperAdmin && activeSubTab === 'roles' && (
            <div className="animate-fade-in">
              <SuperAdminConsole 
                currentUser={currentUser}
                addToast={addToast}
                onRefreshUserData={onRefreshUserData}
              />
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
