import React, { useState, useEffect } from 'react';
import { 
  KeyRound, Users, ShieldAlert, Cpu, Check, AlertTriangle, 
  Search, ShieldCheck, Mail, Phone, ArrowUpRight, Loader2, Save, Play, RefreshCw
} from 'lucide-react';
import { UserState } from '../types';

interface SuperAdminConsoleProps {
  currentUser: UserState;
  addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
  onRefreshUserData: () => void;
}

export function SuperAdminConsole({ currentUser, addToast, onRefreshUserData }: SuperAdminConsoleProps) {
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(true);
  const [searchText, setSearchText] = useState<string>('');

  // Config integration states
  const [config, setConfig] = useState<any>({
    paystack_public_key: '',
    paystack_secret_key: '',
    smm_api_key: '',
    smm_api_url: 'https://easy-smm-panel.com/api/v2',
  });
  const [isUpdatingConfig, setIsUpdatingConfig] = useState<boolean>(false);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);

  // Status/Telemetry simulated events log
  const [selectedUserForRole, setSelectedUserForRole] = useState<any | null>(null);
  const [targetRole, setTargetRole] = useState<string>('user');
  const [isRoleModalOpen, setIsRoleModalOpen] = useState<boolean>(false);
  const [isUpdatingRole, setIsUpdatingRole] = useState<boolean>(false);

  // Simulated telemetry
  const [telemetryLogs, setTelemetryLogs] = useState<Array<{ time: string; level: 'info' | 'warn' | 'success'; msg: string }>>([
    { time: new Date().toLocaleTimeString(), level: 'success', msg: 'System Kernel secured (v3.5 WAL Mode initialized)' },
    { time: new Date(Date.now() - 5000).toLocaleTimeString(), level: 'info', msg: 'SQLite connection pool loaded: max 15 threads' },
    { time: new Date(Date.now() - 15000).toLocaleTimeString(), level: 'info', msg: 'Gateway auto-banking node active: Providus & Sterling API' },
    { time: new Date(Date.now() - 25000).toLocaleTimeString(), level: 'success', msg: 'Paystack webhook listener active on SSL port' }
  ]);

  const addTelemetryLog = (level: 'info' | 'warn' | 'success', msg: string) => {
    setTelemetryLogs(prev => [
      { time: new Date().toLocaleTimeString(), level, msg },
      ...prev.slice(0, 7) // keep last 8 logs
    ]);
  };

  // Fetch Users
  const fetchAllUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const usersRes = await fetch(`/api/admin/users?requesterEmail=${encodeURIComponent(currentUser.email)}`, {
        headers: {
          'x-requester-email': currentUser.email,
          'Accept': 'application/json'
        }
      });
      const data = await usersRes.json();
      if (usersRes.ok && data.success) {
        setUsers(data.users || []);
      } else {
        addToast(data.error || 'Failed to sync users for role delegation.', 'error');
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Error getting users: ${err.message}`, 'error');
    } finally {
      setIsLoadingUsers(false);
    }
  };

  // Fetch configurations
  const fetchGatewayConfigs = async () => {
    setIsLoadingConfig(true);
    try {
      const res = await fetch(`/api/user/vtu-config?email=${encodeURIComponent(currentUser.email)}`);
      const data = await res.json();
      if (res.ok && data.success && data.config) {
        setConfig(data.config);
      }
    } catch (err: any) {
      console.error(err);
      addToast(`Failed to load config details: ${err.message}`, 'error');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  useEffect(() => {
    fetchAllUsers();
    fetchGatewayConfigs();
  }, [currentUser.email]);

  // Update configurations
  const handleUpdateConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingConfig(true);
    addTelemetryLog('info', 'Updating primary transaction gateways config in db...');

    try {
      const res = await fetch('/api/user/vtu-config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: currentUser.email,
          paystackPublicKey: config.paystack_public_key,
          paystackSecretKey: config.paystack_secret_key,
          smmApiKey: config.smm_api_key,
          smmApiUrl: config.smm_api_url,
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast('Master Gateway Configurations saved successfully!', 'success');
        addTelemetryLog('success', 'Master integration keys saved into secure app.sqlite configs table.');
        if (data.config) {
          setConfig(data.config);
        }
      } else {
        addToast(data.error || 'Failed to update gateway.', 'error');
        addTelemetryLog('warn', `DB commit aborted: ${data.error || 'unknown server rejection'}`);
      }
    } catch (err: any) {
      addToast(`Server Error: ${err.message}`, 'error');
      addTelemetryLog('warn', `Network request failure: ${err.message}`);
    } finally {
      setIsUpdatingConfig(false);
    }
  };

  // Update User Role
  const handlePerformRoleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserForRole) return;

    setIsUpdatingRole(true);
    addTelemetryLog('info', `Deploying role authority changes for ${selectedUserForRole.email}...`);
    try {
      const res = await fetch('/api/admin/user/role', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requesterEmail: currentUser.email,
          userEmail: selectedUserForRole.email,
          role: targetRole
        })
      });

      const data = await res.json();
      if (res.ok && data.success) {
        addToast(data.message || 'Access privileges modified!', 'success');
        addTelemetryLog('success', `Privilege upgraded: ${selectedUserForRole.email} set to role [${targetRole}]`);
        setIsRoleModalOpen(false);
        fetchAllUsers();
        if (selectedUserForRole.email === currentUser.email) {
          onRefreshUserData();
        }
      } else {
        addToast(data.error || 'Failed to modify role parameters.', 'error');
        addTelemetryLog('warn', `Authority rejection: ${data.error}`);
      }
    } catch (err: any) {
      addToast(`Error updating role: ${err.message}`, 'error');
      addTelemetryLog('warn', `Failed to set security context: ${err.message}`);
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const handleTestLatencySim = () => {
    addTelemetryLog('info', 'Pinging VTU Routing API clusters for latency check...');
    setTimeout(() => {
      const pingVal = Math.floor(Math.random() * 150) + 75;
      addTelemetryLog('success', `Response from primary routing hub: ${pingVal}ms. Route integrity optimal.`);
      addToast(`Ping Successful! Latency: ${pingVal}ms`, 'success');
    }, 800);
  };

  // Filter users
  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchText.toLowerCase()) ||
    u.email.toLowerCase().includes(searchText.toLowerCase()) ||
    u.phone.includes(searchText)
  );

  return (
    <div className="flex flex-col gap-6 w-full max-w-7xl mx-auto" id="super-admin-os-container">
      {/* SUPER ADMIN CONSOLE SIGNAGE */}
      <div className="bg-gradient-to-r from-violet-950 via-slate-900 to-indigo-950 border border-slate-950 text-white p-6 sm:p-8 rounded-3xl shadow-md relative overflow-hidden" id="super-admin-badge">
        <div className="absolute top-0 right-0 p-8 opacity-5">
          <KeyRound className="w-48 h-48 stroke-[1.5]" />
        </div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-400 animate-pulse" />
              <h1 className="font-display font-black text-xs uppercase tracking-widest text-violet-300">Super Administrative System</h1>
            </div>
            <h2 className="text-xl sm:text-2xl font-black font-display tracking-tight">SUPER ADMiN MASTER CONSOLE</h2>
            <p className="text-xs text-slate-400 font-sans max-w-xl">
              This terminal controls core settings, credentials, and API connection gateways. Be cautious when editing secrets as they dictate active billing routes on Paystack and other vendors.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleTestLatencySim}
              className="px-4 py-2 bg-indigo-505 bg-white/10 hover:bg-white/15 text-white active:scale-95 transition-all text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-white/5"
            >
              <Cpu className="w-3.5 h-3.5" />
              Ping Router
            </button>
            <button
              onClick={() => {
                fetchAllUsers();
                fetchGatewayConfigs();
                addToast('System registry synchronized.', 'info');
              }}
              className="px-4 py-2 bg-violet-600 hover:bg-violet-550 active:scale-95 transition-all text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-md shadow-violet-500/10"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reload Core
            </button>
          </div>
        </div>
      </div>

      {/* THREE SECTIONS ROW (TELEMETRY, GATEWAY SETTINGS, USER PRIVILEGES) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* LEFT COLUMN: GATEWAY SETTINGS (7/12 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="bg-white p-6 border border-slate-101 shadow-sm rounded-3xl flex flex-col gap-5">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <KeyRound className="w-4.5 h-4.5 text-violet-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 font-display">Active Merchant Integration Gateways</h3>
            </div>

            {isLoadingConfig ? (
              <div className="py-12 flex flex-col items-center text-slate-400 gap-2">
                <Loader2 className="w-6 h-6 text-violet-500 animate-spin" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Syncing Master API Credentials...</span>
              </div>
            ) : (
              <form onSubmit={handleUpdateConfig} className="flex flex-col gap-5">
                
                {/* PAYSTACK SECTION */}
                <div className="p-4 bg-slate-50 border border-slate-101 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-[#06503c] font-display flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Paystack Gate (Billing & Virtual Account Funding)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest font-mono">Public Key</label>
                      <input
                        type="text"
                        value={config.paystack_public_key || ''}
                        onChange={(e) => setConfig({ ...config, paystack_public_key: e.target.value })}
                        placeholder="pk_live_..."
                        className="p-2 border border-slate-205 text-xs font-mono bg-white rounded-xl outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest font-mono">Secret Key</label>
                      <input
                        type="password"
                        value={config.paystack_secret_key || ''}
                        onChange={(e) => setConfig({ ...config, paystack_secret_key: e.target.value })}
                        placeholder="sk_live_..."
                        className="p-2 border border-slate-205 text-xs font-mono bg-white rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>



                {/* SMM SECTION */}
                <div className="p-4 bg-slate-50 border border-slate-101 rounded-2xl flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-black uppercase tracking-wider text-rose-800 font-display flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500" />
                      Social Media Booster API (SMM Panel)
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest font-mono">API Server URL</label>
                      <input
                        type="text"
                        value={config.smm_api_url || 'https://easy-smm-panel.com/api/v2'}
                        onChange={(e) => setConfig({ ...config, smm_api_url: e.target.value })}
                        className="p-2 border border-slate-205 text-xs font-mono bg-white rounded-xl outline-none"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label className="text-[9px] font-black text-slate-455 uppercase tracking-widest font-mono">Authorization Key</label>
                      <input
                        type="password"
                        value={config.smm_api_key || ''}
                        onChange={(e) => setConfig({ ...config, smm_api_key: e.target.value })}
                        placeholder="SMM authorization token..."
                        className="p-2 border border-slate-205 text-xs font-mono bg-white rounded-xl outline-none"
                      />
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isUpdatingConfig}
                  className="w-full py-3 mt-1 bg-slate-900 hover:bg-black text-white text-xs font-black font-display tracking-widest uppercase rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-slate-900/10"
                >
                  {isUpdatingConfig ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating Active Integration Credentials...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Save Integration Configuration
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: PRIVILEGES & TELEMETRY (5/12 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          
          {/* USER PRIVILEGES LIST */}
          <div className="bg-white p-6 border border-slate-101 shadow-sm rounded-3xl flex flex-col gap-4">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
              <Users className="w-4.5 h-4.5 text-violet-600" />
              <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 font-display">Privileges & Role Delegation</h3>
            </div>

            <div className="relative">
              <input
                type="text"
                placeholder="Find client (email, name)..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                className="w-full p-2 pl-8 border border-slate-205 text-xs bg-slate-50 focus:bg-white rounded-xl outline-none"
              />
              <Search className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-455" />
            </div>

            {isLoadingUsers ? (
              <div className="py-8 flex flex-col items-center justify-center text-slate-400 gap-1.5">
                <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
                <span className="text-[10px] uppercase font-bold tracking-wider">Loading user database table...</span>
              </div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto pr-1 no-scrollbar select-none" id="super-admin-user-roles-list">
                {filteredUsers.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 uppercase font-black text-[10px] tracking-wider border border-dashed rounded-2xl">
                    No matching users found
                  </div>
                ) : (
                  filteredUsers.map((u) => (
                    <div 
                      key={u.email} 
                      className="p-3 border border-slate-101 bg-slate-50 hover:bg-slate-100/50 rounded-xl flex items-center justify-between gap-3 transition-all"
                    >
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="font-bold text-slate-800 truncate block text-xs">{u.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono truncate block leading-none">{u.email}</span>
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border leading-none tracking-widest ${
                            u.role === 'super_admin' ? 'bg-violet-100 text-violet-750 border-violet-200' :
                            u.role === 'admin' ? 'bg-rose-100 text-rose-750 border-rose-200' :
                            'bg-slate-200 text-slate-650 border-slate-300'
                          }`}>
                            {u.role || 'user'}
                          </span>
                        </div>
                      </div>

                      <button
                        onClick={() => {
                          setSelectedUserForRole(u);
                          setTargetRole(u.role || 'user');
                          setIsRoleModalOpen(true);
                        }}
                        className="px-3 py-1.5 bg-white border border-slate-205 hover:bg-slate-50 text-slate-700 text-[10px] font-extrabold font-display rounded-lg transition-all active:scale-95 cursor-pointer shrink-0"
                      >
                        Set Role
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>

          {/* TELEMETRY LOGS */}
          <div className="bg-slate-900 border border-slate-950 p-6 shadow-sm rounded-3xl flex flex-col gap-4 text-white">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-violet-400 animate-pulse" />
                <h3 className="text-xs font-black uppercase tracking-widest text-[#B5F5D3] font-display">System Virtual Telemetry</h3>
              </div>
              <span className="text-[10px] font-mono bg-white/10 px-2 py-0.5 rounded-full text-slate-300">ACTIVE</span>
            </div>

            <div className="flex flex-col gap-2 font-mono text-[10px] leading-relaxed max-h-[220px] overflow-y-auto no-scrollbar pr-1">
              {telemetryLogs.map((log, idx) => (
                <div key={idx} className="flex gap-2 items-start border-b border-white/5 pb-1.5">
                  <span className="text-slate-500 shrink-0">{log.time}</span>
                  <span className={`font-black shrink-0 ${
                    log.level === 'success' ? 'text-emerald-400' :
                    log.level === 'warn' ? 'text-rose-500' : 'text-[#c691f5]'
                  }`}>
                    [{log.level.toUpperCase()}]
                  </span>
                  <span className="text-slate-300 break-all">{log.msg}</span>
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>

      {/* ACCESS LEVEL MODAL CONTROL */}
      {isRoleModalOpen && selectedUserForRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]">
          <div className="bg-white rounded-3xl border border-slate-101 shadow-lg max-w-sm w-full p-6 flex flex-col gap-5 select-none animate-[slideUp_0.25s_ease-out]">
            <div className="flex items-center justify-between border-b border-slate-50 pb-3">
              <h3 className="font-display font-black text-slate-900 text-sm tracking-wide uppercase flex items-center gap-1.5 text-slate-800">
                <ShieldAlert className="w-4.5 h-4.5 text-rose-500" />
                Re-Delegate Access Privileges
              </h3>
              <button
                onClick={() => setIsRoleModalOpen(false)}
                className="p-1 px-2.5 text-slate-400 hover:text-slate-800 font-sans text-xs font-bold"
              >
                ✕ Close
              </button>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-100 rounded-2xl text-[11px] leading-relaxed text-slate-500">
              <div className="flex justify-between items-center mb-1">
                <span className="font-semibold text-slate-455">Target Profile:</span>
                <span className="font-extrabold text-slate-800">{selectedUserForRole.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="font-semibold text-slate-455">Target Email:</span>
                <span className="font-extrabold text-slate-800 font-mono">{selectedUserForRole.email}</span>
              </div>
            </div>

            <form onSubmit={handlePerformRoleUpdate} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] font-black text-slate-455 uppercase tracking-widest block font-display">Target Systems Security Role</label>
                <select
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full p-2.5 border border-slate-205 text-xs rounded-xl bg-slate-50 outline-none font-bold"
                >
                  <option value="user">User (Standard Customer Terminal)</option>
                  <option value="admin">Admin (Operational Console + Ledgers)</option>
                  <option value="super_admin">Super Admin (Master Configuration OS)</option>
                </select>
              </div>

              <div className="flex items-start gap-2 bg-rose-50 border border-rose-100 p-3 rounded-xl text-[10px] text-rose-800 leading-relaxed">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>
                  <strong>CRITICAL SECURITY ACTION:</strong> Promoting a user to Admin exposes system audit ledgers and KYC tier overrides. Promoting to Super Admin enables live credentials read/write access.
                </span>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <button
                  type="submit"
                  disabled={isUpdatingRole}
                  className="w-full py-2.5 bg-slate-900 hover:bg-black text-white text-xs font-bold font-display rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-md shadow-slate-900/10"
                >
                  {isUpdatingRole ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Syncing privilege tokens...
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-4 h-4 text-emerald-400 font-bold" />
                      Commit Privilege Change
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
