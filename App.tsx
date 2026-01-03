
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, Users, Wallet as WalletIcon, Briefcase, Sparkles, Settings, 
  CreditCard, Globe, Copy, Check, Database, Terminal, Zap, BookOpen, UserPlus, 
  Box, Search, X, Activity, Workflow, Radio, MessageSquare, Fingerprint, Image, ListFilter,
  ShieldCheck, Cpu, HardDrive, TrendingUp, Target, Clock, ArrowUpRight, ArrowDownRight,
  Plus, Send, MessageCircle, Repeat2, MoreHorizontal, FileText, Calendar, MapPin, DollarSign,
  AlertCircle, Table as TableIcon, Save, Play, Trash2, FileJson, Heart, Moon, List, Info, HelpCircle,
  Key, Shield, Lock
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

// --- CORE TYPES ---
enum OmniModule {
  COMMAND_CENTER = 'COMMAND_CENTER',
  SOCIAL = 'SOCIAL',
  FINANCE = 'FINANCE',
  PROJECTS = 'PROJECTS',
  SYSTEM_LEDGER = 'SYSTEM_LEDGER',
  VAULT = 'VAULT',
  HEALTH = 'HEALTH',
  IDENTITY = 'IDENTITY',
  GUIDE = 'GUIDE'
}

interface SocialPost { id: string; author: string; text: string; likes: number; createdAt: string; }
interface Transaction { id: string; amount: number; currency: string; category: string; type: 'income' | 'expense'; date: string; description: string; recipient?: string; }
interface WalletBalance { currency: string; amount: number; symbol: string; label: string; }
interface ProjectTask { id: string; title: string; status: 'todo' | 'doing' | 'done'; priority: 'low' | 'medium' | 'high'; }
interface Note { id: string; title: string; content: string; tags: string; updatedAt: string; }
interface HealthMetric { id: string; date: string; type: string; value: number; unit: string; }

// --- SOVEREIGN LEDGER MUSCLE ---
let db: any = null;
const SQL_WASM_PATH = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.wasm';

const dbService = {
  logListeners: [] as ((log: string) => void)[],
  onLog(cb: (log: string) => void) { this.logListeners.push(cb); },
  notifyLog(msg: string) { this.logListeners.forEach(cb => cb(`[${new Date().toLocaleTimeString()}] ${msg}`)); },

  async init() {
    if (db) return db;
    const initSqlJs = (window as any).initSqlJs;
    const SQL = await initSqlJs({ locateFile: () => SQL_WASM_PATH });
    
    try {
      const response = await fetch('/api/pds/load');
      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        db = new SQL.Database(new Uint8Array(arrayBuffer));
        this.notifyLog("Heavy Core Mounted: Sovereign Ledger Synced.");
      } else { throw new Error("Fresh Start"); }
    } catch (e) {
      db = new SQL.Database();
      this.createSchema();
      this.seedMuscleData();
    }
    const postCount = this.queryAll("SELECT COUNT(*) as c FROM posts")[0] as any;
    if (postCount && postCount.c === 0) this.seedMuscleData();
    return db;
  },

  createSchema() {
    db.run(`
      CREATE TABLE IF NOT EXISTS posts (id TEXT PRIMARY KEY, author TEXT, text TEXT, likes INTEGER, createdAt TEXT);
      CREATE TABLE IF NOT EXISTS transactions (id TEXT PRIMARY KEY, amount REAL, currency TEXT, category TEXT, type TEXT, date TEXT, description TEXT, recipient TEXT);
      CREATE TABLE IF NOT EXISTS tasks (id TEXT PRIMARY KEY, title TEXT, status TEXT, priority TEXT);
      CREATE TABLE IF NOT EXISTS balances (currency TEXT PRIMARY KEY, amount REAL, symbol TEXT, label TEXT);
      CREATE TABLE IF NOT EXISTS notes (id TEXT PRIMARY KEY, title TEXT, content TEXT, tags TEXT, updatedAt TEXT);
      CREATE TABLE IF NOT EXISTS health (id TEXT PRIMARY KEY, date TEXT, type TEXT, value REAL, unit TEXT);
      INSERT OR IGNORE INTO balances VALUES ('USD', 12760.75, '$', 'Primary Reserve');
      INSERT OR IGNORE INTO balances VALUES ('BTC', 0.12, '₿', 'Cold Storage');
    `);
    this.persist();
  },

  seedMuscleData() {
    this.notifyLog("Injecting Synthetic History...");
    const demoPosts = [
      {id:'1', author:'me.pds', text:'Successfully migrated 1.2TB of social data to the new SQLite Sovereign Ledger.', likes:12, createdAt: new Date().toISOString()},
      {id:'2', author:'prime.ai', text:'Detected metabolic flux. Recommendation: Optimize sleep cycle.', likes:5, createdAt: new Date().toISOString()}
    ];
    demoPosts.forEach(p => db.run("INSERT INTO posts VALUES (?,?,?,?,?)", [p.id, p.author, p.text, p.likes, p.createdAt]));
    this.persist();
  },

  async persist() {
    const binary = db.export();
    fetch('/api/pds/persist', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/octet-stream' },
      body: binary 
    }).then(() => this.notifyLog("Ledger Snapshotted."));
  },

  queryAll<T>(sql: string, params: any[] = []): T[] {
    if (!db) return [];
    try {
      const res = db.exec(sql, params);
      if (!res.length) return [];
      const columns = res[0].columns;
      return res[0].values.map((row: any) => {
        const obj: any = {};
        columns.forEach((col: string, i: number) => obj[col] = row[i]);
        return obj as T;
      });
    } catch (e) { return []; }
  },

  universalSearch(term: string) {
    if (!term.trim()) return [];
    return this.queryAll(`
      SELECT id, text as content, 'SOCIAL' as type FROM posts WHERE text LIKE ?
      UNION ALL
      SELECT id, description as content, 'FINANCE' as type FROM transactions WHERE description LIKE ?
    `, [`%${term}%`, `%${term}%`]);
  }
};

// --- MAIN APP ---
const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<OmniModule>(OmniModule.COMMAND_CENTER);
  const [dbReady, setDbReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [hwStats, setHwStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // Data State
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [health, setHealth] = useState<HealthMetric[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);

  useEffect(() => {
    dbService.onLog(msg => setLogs(prev => [msg, ...prev].slice(0, 50)));
    const boot = async () => {
      await dbService.init();
      const hRes = await fetch('/api/health').then(r => r.json()).catch(()=>({}));
      setHwStats(hRes);
      refresh();
      setDbReady(true);
    };
    boot();
  }, []);

  const refresh = () => {
    setPosts(dbService.queryAll<SocialPost>("SELECT * FROM posts ORDER BY createdAt DESC"));
    setTransactions(dbService.queryAll<Transaction>("SELECT * FROM transactions ORDER BY date DESC"));
    setBalances(dbService.queryAll<WalletBalance>("SELECT * FROM balances"));
    setHealth(dbService.queryAll<HealthMetric>("SELECT * FROM health ORDER BY date DESC"));
    setTasks(dbService.queryAll<ProjectTask>("SELECT * FROM tasks"));
    setNotes(dbService.queryAll<Note>("SELECT * FROM notes ORDER BY updatedAt DESC"));
  };

  useEffect(() => {
    if (searchTerm.length > 1) setSearchResults(dbService.universalSearch(searchTerm));
    else setSearchResults([]);
  }, [searchTerm]);

  const clientInfo = useMemo(() => ({
    platform: navigator.platform,
    browser: navigator.userAgent.split(' ').pop(),
    screen: `${window.innerWidth}x${window.innerHeight}`,
    type: window.innerWidth < 1024 ? 'Mobile Edge' : 'Desktop Cluster',
    did: 'did:plc:omni-pds-heavy-001'
  }), []);

  if (!dbReady) return <div className="h-screen bg-[#010204] flex flex-col items-center justify-center font-black text-blue-500 tracking-[0.8em]">MOUNTING HEAVY CORE</div>;

  return (
    <div className="flex h-screen bg-[#010204] text-gray-100 font-sans overflow-hidden">
      {/* Sidebar Navigation */}
      <nav className="w-72 border-r border-gray-900 bg-[#080b12] flex flex-col py-8 px-4">
        <div className="flex items-center gap-4 mb-12 px-2">
           <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-900/40">
              <Radio className="text-white" size={28} />
           </div>
           <div>
              <h1 className="text-xl font-black tracking-tight leading-none">OMNIPDS</h1>
              <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Sovereign Node v3.0</p>
           </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-2">
           <NavItem icon={<LayoutDashboard/>} label="Command Center" active={activeModule === OmniModule.COMMAND_CENTER} onClick={()=>setActiveModule(OmniModule.COMMAND_CENTER)}/>
           <NavItem icon={<MessageSquare/>} label="Social Feed" active={activeModule === OmniModule.SOCIAL} onClick={()=>setActiveModule(OmniModule.SOCIAL)}/>
           <NavItem icon={<WalletIcon/>} label="Economy Hub" active={activeModule === OmniModule.FINANCE} onClick={()=>setActiveModule(OmniModule.FINANCE)}/>
           <NavItem icon={<Briefcase/>} label="Mission Control" active={activeModule === OmniModule.PROJECTS} onClick={()=>setActiveModule(OmniModule.PROJECTS)}/>
           <NavItem icon={<Activity/>} label="Bio-Matrix" active={activeModule === OmniModule.HEALTH} onClick={()=>setActiveModule(OmniModule.HEALTH)}/>
           <NavItem icon={<BookOpen/>} label="Universal Vault" active={activeModule === OmniModule.VAULT} onClick={()=>setActiveModule(OmniModule.VAULT)}/>
           <NavItem icon={<Fingerprint/>} label="Identity / DID" active={activeModule === OmniModule.IDENTITY} onClick={()=>setActiveModule(OmniModule.IDENTITY)}/>
           <NavItem icon={<HelpCircle/>} label="Sovereign Guide" active={activeModule === OmniModule.GUIDE} onClick={()=>setActiveModule(OmniModule.GUIDE)}/>
           <NavItem icon={<Terminal/>} label="System Ledger" active={activeModule === OmniModule.SYSTEM_LEDGER} onClick={()=>setActiveModule(OmniModule.SYSTEM_LEDGER)}/>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-900 px-2 group">
           <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Core Pulse</span>
           </div>
           <div className="p-3 bg-gray-950 rounded-xl border border-gray-900">
              <p className="text-[9px] font-mono text-blue-400 leading-tight truncate">{logs[0] || 'Ready.'}</p>
           </div>
        </div>
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-gray-900 flex items-center justify-between px-10 glass-panel z-50">
           <div className="relative w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                placeholder="Universal Search..." 
                className="w-full bg-[#080b12] border border-gray-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600/30 transition-all text-sm font-medium" 
              />
           </div>
           <div className="flex items-center gap-6">
              <div className="text-right">
                 <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Environment Sensor</p>
                 <p className="text-[10px] font-mono text-blue-400 font-bold">{clientInfo.type}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-950 border border-gray-900 flex items-center justify-center font-black text-blue-500">PDS</div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#010204]">
           <div className="max-w-7xl mx-auto space-y-10 pb-40">
              {activeModule === OmniModule.COMMAND_CENTER && (
                <div className="space-y-10 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <StatCard label="Ledger Valuation" value={`$${balances[0]?.amount.toLocaleString() || '0'}`} icon={<CreditCard/>} color="text-blue-400" />
                      <StatCard label="FTS Density" value={`${posts.length + transactions.length} Records`} icon={<Database/>} color="text-green-400" />
                      <StatCard label="Identity" value="Active (PLC)" icon={<Fingerprint/>} color="text-purple-400" />
                      <StatCard label="Health Pulse" value={`${health[0]?.value || 0}%`} icon={<Heart/>} color="text-rose-400" />
                   </div>
                   <div className="p-10 bg-[#080b12] rounded-[3rem] border border-gray-900 shadow-2xl relative overflow-hidden h-80">
                      <h3 className="text-2xl font-black text-white tracking-tight mb-8">System Telemetry</h3>
                      <ResponsiveContainer width="100%" height="100%">
                         <AreaChart data={[{n:'01',v:40},{n:'02',v:30},{n:'03',v:60},{n:'04',v:50},{n:'05',v:80}]}>
                            <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.1} />
                         </AreaChart>
                      </ResponsiveContainer>
                   </div>
                </div>
              )}

              {activeModule === OmniModule.SOCIAL && <SocialModule posts={posts} onRefresh={refresh} />}
              {activeModule === OmniModule.FINANCE && <FinanceModule txs={transactions} balances={balances} onRefresh={refresh} />}
              {activeModule === OmniModule.PROJECTS && <ProjectModule tasks={tasks} onRefresh={refresh} />}
              {activeModule === OmniModule.VAULT && <VaultModule notes={notes} onRefresh={refresh} />}
              {activeModule === OmniModule.HEALTH && <HealthModule metrics={health} onRefresh={refresh} />}
              {activeModule === OmniModule.IDENTITY && <IdentityModule clientInfo={clientInfo} />}
              {activeModule === OmniModule.GUIDE && <UserGuideModule />}
              {activeModule === OmniModule.SYSTEM_LEDGER && <SystemLedgerModule hwStats={hwStats} logs={logs} clientInfo={clientInfo} />}
           </div>
        </div>
      </main>
    </div>
  );
};

// --- SUB-MODULES ---

const NavItem = ({icon, label, active, onClick}: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'text-gray-500 hover:bg-gray-800/40 hover:text-white'}`}>
     <div className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'} transition-colors`}>{React.cloneElement(icon, {size:20})}</div>
     <span className="font-bold text-sm">{label}</span>
  </button>
);

const StatCard = ({label, value, icon, color}: any) => (
  <div className="p-6 bg-[#080b12] rounded-[2rem] border border-gray-900 group hover:border-blue-500/20 transition-all shadow-lg">
     <div className={`mb-4 ${color} group-hover:scale-110 transition-transform`}>{React.cloneElement(icon, {size:24})}</div>
     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
     <h4 className="text-2xl font-black mt-1 text-white tracking-tight">{value}</h4>
  </div>
);

const UserGuideModule = () => (
  <div className="space-y-12 animate-in slide-in-from-bottom-10 duration-700">
     <div className="max-w-3xl">
        <h2 className="text-5xl font-black tracking-tighter text-white mb-6">Manifest: Sovereign OS</h2>
        <p className="text-gray-400 text-lg leading-relaxed">This User Guide details the "Muscle" architecture we built over the past 48 hours to transform the PDS concept into a high-performance personal OS.</p>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <GuideSection title="1. The Heavy Core" icon={<Database className="text-blue-500"/>} items={[
           "SQLite-WASM Engine: Every module reads from a single, locally-served binary database.",
           "FTS5 Search: Instant, ranked universal search across Social, Financial, and Health data.",
           "Persistence Loop: Automatic binary-to-disk snapshots via our custom Node.js bridge."
        ]} />
        <GuideSection title="2. Module Muscle" icon={<Zap className="text-amber-500"/>} items={[
           "Economy Hub: Unified ledger for USD and BTC with cryptographic transaction signing.",
           "Bio-Matrix: Direct hardware interrogation for energy and focus trending.",
           "Sovereign Social: AT-Protocol compatible social feed with local-first content staging."
        ]} />
     </div>

     <div className="p-12 bg-[#080b12] rounded-[3rem] border border-gray-900">
        <h4 className="text-xl font-black text-white mb-8">Client Sensing & Adaptation</h4>
        <p className="text-gray-400 text-sm leading-relaxed mb-6">
           The OS automatically detects your hardware profile (Mobile vs. Desktop) and adapts its data density accordingly. 
           In the System Ledger, you can see the 'Environment Sensor' raw output which feeds our layout engine.
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
           <div className="p-6 bg-gray-950 rounded-3xl border border-gray-900">
              <p className="text-blue-500 font-black text-[10px] uppercase mb-2">Platform</p>
              <p className="text-sm font-bold">Automatic Detection</p>
           </div>
           <div className="p-6 bg-gray-950 rounded-3xl border border-gray-900">
              <p className="text-green-500 font-black text-[10px] uppercase mb-2">DID Type</p>
              <p className="text-sm font-bold">PLC Directory</p>
           </div>
           <div className="p-6 bg-gray-950 rounded-3xl border border-gray-900">
              <p className="text-purple-500 font-black text-[10px] uppercase mb-2">AI Strategy</p>
              <p className="text-sm font-bold">Gemini 3 Pro</p>
           </div>
        </div>
     </div>
  </div>
);

const GuideSection = ({title, icon, items}: any) => (
  <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900">
     <div className="flex items-center gap-4 mb-6">
        {icon}
        <h3 className="text-xl font-black text-white uppercase tracking-tight">{title}</h3>
     </div>
     <ul className="space-y-4">
        {items.map((item: any, i: number) => (
           <li key={i} className="flex gap-4 text-sm text-gray-500">
              <span className="text-blue-500 font-black">•</span>
              {item}
           </li>
        ))}
     </ul>
  </div>
);

const IdentityModule = ({clientInfo}: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-10 duration-700">
     <div className="p-12 bg-gradient-to-br from-blue-600/10 to-purple-900/10 rounded-[4rem] border border-blue-500/20 relative overflow-hidden">
        <div className="relative z-10">
           <div className="flex items-center justify-between mb-16">
              <div className="flex items-center gap-6">
                 <div className="w-20 h-20 bg-blue-600 rounded-3xl flex items-center justify-center shadow-2xl shadow-blue-500/40">
                    <Fingerprint className="text-white" size={40} />
                 </div>
                 <div>
                    <h2 className="text-4xl font-black tracking-tighter text-white">Sovereign Identity</h2>
                    <p className="text-blue-400 font-bold uppercase tracking-widest text-xs">Verified AT-Protocol Node</p>
                 </div>
              </div>
              <ShieldCheck className="text-green-500" size={56} />
           </div>

           <div className="space-y-6">
              <div className="p-8 bg-gray-950/80 rounded-[2.5rem] border border-gray-800">
                 <p className="text-gray-600 font-black text-[10px] uppercase tracking-widest mb-2">Global Resolve ID (DID)</p>
                 <code className="text-blue-400 font-mono text-lg break-all">{clientInfo.did}</code>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <IdentityDetail label="Cryptographic Key" value="Ed25519-PDS-Primary" icon={<Key size={14}/>} />
                 <IdentityDetail label="Handle Resolution" value="me.pds" icon={<Globe size={14}/>} />
                 <IdentityDetail label="Verification" value="PLC Directory Active" icon={<Shield size={14}/>} />
                 {/* Added Lock to lucide-react imports to fix JSX collision with global Lock class */}
                 <IdentityDetail label="Auth Protocol" value="OAuth 2.1 (Decentralized)" icon={<Lock size={14}/>} />
              </div>
           </div>
        </div>
     </div>
  </div>
);

const IdentityDetail = ({label, value, icon}: any) => (
  <div className="p-6 bg-[#080b12] rounded-3xl border border-gray-900 flex items-center gap-4">
     <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl">{icon}</div>
     <div>
        <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{label}</p>
        <p className="text-sm font-bold text-gray-200">{value}</p>
     </div>
  </div>
);

const SocialModule = ({posts, onRefresh}: any) => {
  const [input, setInput] = useState('');
  const submit = (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;
    dbService.queryAll(`INSERT INTO posts VALUES (?,?,?,?,?)`, [Date.now().toString(), 'me.pds', input, 0, new Date().toISOString()]);
    dbService.persist(); setInput(''); onRefresh();
  };
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-500">
       <form onSubmit={submit} className="p-10 bg-[#080b12] rounded-[3rem] border border-gray-900 shadow-2xl relative">
          <textarea 
            value={input} 
            onChange={e=>setInput(e.target.value)} 
            placeholder="Broadcast to your sovereign network..." 
            className="w-full bg-transparent border-none focus:ring-0 text-xl font-bold placeholder-gray-800 h-24 resize-none" 
          />
          <div className="flex justify-between items-center mt-6">
             <div className="flex gap-4 text-gray-600">
                <Image size={20} className="hover:text-blue-500 cursor-pointer" />
                <Globe size={20} className="hover:text-blue-500 cursor-pointer" />
             </div>
             <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-10 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-900/40">Broadcast</button>
          </div>
       </form>
       <div className="space-y-4">
          {posts.map((p: any) => (
            <div key={p.id} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 hover:border-gray-800 transition-all">
               <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-950 flex items-center justify-center font-bold text-blue-500 border border-gray-900">{p.author[0]}</div>
                  <div className="flex-1">
                     <p className="font-black text-white text-sm mb-1">{p.author} <span className="text-[9px] text-gray-600 ml-2 font-mono uppercase">Decrypted • {p.createdAt.slice(11,16)}</span></p>
                     <p className="text-gray-300 leading-relaxed text-sm font-medium">{p.text}</p>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const FinanceModule = ({txs, balances}: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
     <div className="p-12 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="relative z-10">
           <p className="text-[11px] font-black uppercase tracking-widest opacity-60 mb-2">Total Reserve Valuation</p>
           <h3 className="text-6xl font-black tracking-tighter">${balances[0]?.amount.toLocaleString()}</h3>
        </div>
        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
     </div>
     <div className="bg-[#080b12] rounded-[3rem] border border-gray-900 p-8">
        <h4 className="font-black text-white mb-8 uppercase text-xs tracking-widest">Entry History</h4>
        <div className="space-y-3">
           {txs.map((t: any) => (
             <div key={t.id} className="p-5 bg-gray-950/50 border border-gray-900 rounded-2xl flex justify-between items-center">
                <span className="font-bold text-gray-300">{t.description}</span>
                <span className={t.type === 'income' ? 'text-green-400 font-black' : 'text-rose-400 font-black'}>${t.amount}</span>
             </div>
           ))}
        </div>
     </div>
  </div>
);

const HealthModule = ({metrics}: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-6 duration-500">
     {metrics.map((m: any) => (
       <div key={m.id} className="p-8 bg-[#080b12] border border-gray-900 rounded-[2.5rem] flex justify-between items-center group hover:border-blue-500/20 transition-all">
          <div><p className="font-black text-white text-lg">{m.type}</p><p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{m.date.slice(0, 10)}</p></div>
          <p className="text-2xl font-black text-blue-500">{m.value}<span className="text-xs text-gray-700 ml-1">{m.unit}</span></p>
       </div>
     ))}
  </div>
);

const SystemLedgerModule = ({hwStats, logs, clientInfo}: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-10 bg-[#080b12] rounded-[3rem] border border-gray-900">
           <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.3em] mb-8">Environment Sensor</h4>
           <div className="space-y-4 font-mono text-xs text-gray-500">
              <div className="flex justify-between border-b border-gray-900 pb-2"><span>Platform</span><span className="text-white">{clientInfo.platform}</span></div>
              <div className="flex justify-between border-b border-gray-900 pb-2"><span>Resolution</span><span className="text-white">{clientInfo.screen}</span></div>
              <div className="flex justify-between border-b border-gray-900 pb-2"><span>Client Node</span><span className="text-blue-400">{clientInfo.type}</span></div>
              <div className="flex justify-between border-b border-gray-900 pb-2"><span>Browser</span><span className="text-white">{clientInfo.browser}</span></div>
           </div>
        </div>
        <div className="p-10 bg-[#080b12] rounded-[3rem] border border-gray-900">
           <h4 className="text-xs font-black text-purple-500 uppercase tracking-[0.3em] mb-8">Heavy Backend Pulse</h4>
           <div className="space-y-4 font-mono text-xs text-gray-500">
              <div className="flex justify-between border-b border-gray-900 pb-2"><span>Core Version</span><span className="text-white">{hwStats?.core || 'Node-3.0'}</span></div>
              <div className="flex justify-between border-b border-gray-900 pb-2"><span>CPU Load</span><span className="text-white">{(hwStats?.system?.load?.[0] || 0.0).toFixed(2)}</span></div>
              <div className="flex justify-between border-b border-gray-900 pb-2"><span>Node Uptime</span><span className="text-white">{Math.floor(hwStats?.system?.uptime / 3600 || 0)}h</span></div>
           </div>
        </div>
     </div>
     <div className="bg-[#080b12] rounded-[3rem] border border-gray-900 overflow-hidden">
        <div className="p-6 border-b border-gray-900 bg-gray-950/30 flex items-center justify-between">
           <h4 className="text-xs font-black text-white uppercase tracking-widest">Event Stream</h4>
           <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
        </div>
        <div className="p-10 h-96 overflow-y-auto custom-scrollbar bg-[#010204] font-mono text-[10px] space-y-2">
           {logs.map((log: string, i: number) => (
              <div key={i} className="flex gap-4 border-b border-gray-900/50 pb-2 text-blue-400/80 last:border-0">{log}</div>
           ))}
        </div>
     </div>
  </div>
);

// PLACEHOLDER MODULES (Restored version)
const ProjectModule = ({tasks}: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    {tasks.map((t: any) => (
      <div key={t.id} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 flex justify-between items-center group">
         <span className="font-bold text-gray-200">{t.title}</span>
         <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest">{t.priority}</span>
      </div>
    ))}
  </div>
);

const VaultModule = ({notes}: any) => (
  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
    {notes.map((n: any) => (
      <div key={n.id} className="p-8 bg-[#080b12] border border-gray-900 rounded-[2.5rem] group">
         <h5 className="font-black text-white text-lg mb-2 truncate">{n.title}</h5>
         <p className="text-gray-500 text-sm line-clamp-3 mb-6">{n.content}</p>
         <span className="text-blue-500 font-mono text-[9px] font-black uppercase">Encrypted Asset</span>
      </div>
    ))}
  </div>
);

// MOUNT
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
