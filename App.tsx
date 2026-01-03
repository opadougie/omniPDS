
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, Users, Wallet as WalletIcon, Briefcase, Sparkles, Settings, 
  CreditCard, Globe, Copy, Check, Database, Terminal, Zap, BookOpen, UserPlus, 
  Box, Search, X, Activity, Workflow, Radio, MessageSquare, Fingerprint, Image, ListFilter,
  ShieldCheck, Cpu, HardDrive, TrendingUp, Target, Clock, ArrowUpRight, ArrowDownRight,
  Plus, Send, MessageCircle, Repeat2, MoreHorizontal, FileText, Calendar, MapPin, DollarSign,
  AlertCircle, Table as TableIcon, Save, Play, Trash2, FileJson, Heart, Moon, List, Info, HelpCircle
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, LineChart, Line } from 'recharts';

// --- CORE TYPES ---
enum OmniModule {
  COMMAND_CENTER = 'COMMAND_CENTER',
  SOCIAL = 'SOCIAL',
  FINANCE = 'FINANCE',
  PROJECTS = 'PROJECTS',
  INSIGHTS = 'INSIGHTS',
  WALLET = 'WALLET',
  SYSTEM_LEDGER = 'SYSTEM_LEDGER',
  VAULT = 'VAULT',
  HEALTH = 'HEALTH',
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
  ftsEnabled: false,

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
    this.ensureFTS();
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
    this.notifyLog("Muscle Matrix Empty. Injecting Synthetic History...");
    const demoPosts = [
      {id:'1', author:'me.pds', text:'Successfully migrated 1.2TB of social data to the new SQLite Sovereign Ledger. Feels fast.', likes:12, createdAt: new Date(Date.now()-100000).toISOString()},
      {id:'2', author:'prime.ai', text:'Detected metabolic flux in bio-matrix. Recommendation: Optimize circadian rhythm.', likes:5, createdAt: new Date(Date.now()-500000).toISOString()}
    ];
    demoPosts.forEach(p => db.run("INSERT INTO posts VALUES (?,?,?,?,?)", [p.id, p.author, p.text, p.likes, p.createdAt]));
    this.persist();
  },

  ensureFTS() {
    try {
      db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS fts_ledger USING fts5(id UNINDEXED, content, type UNINDEXED);`);
      this.ftsEnabled = true;
      this.notifyLog("FTS5 Engine Primed.");
    } catch(e) { this.ftsEnabled = false; }
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

// --- APP COMPONENT ---
const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<OmniModule>(OmniModule.COMMAND_CENTER);
  const [dbReady, setDbReady] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [hwStats, setHwStats] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  // High-Density State
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [health, setHealth] = useState<HealthMetric[]>([]);

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
  };

  useEffect(() => {
    if (searchTerm.length > 1) setSearchResults(dbService.universalSearch(searchTerm));
    else setSearchResults([]);
  }, [searchTerm]);

  const clientInfo = useMemo(() => ({
    platform: navigator.platform,
    browser: navigator.userAgent.split(' ').pop(),
    screen: `${window.innerWidth}x${window.innerHeight}`,
    type: window.innerWidth < 768 ? 'Mobile Node' : 'Desktop Cluster'
  }), []);

  if (!dbReady) return <div className="h-screen bg-[#010204] flex items-center justify-center font-black text-blue-500 animate-pulse tracking-[1em]">INITIALIZING CORE</div>;

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
           <NavItem icon={<Activity/>} label="Bio-Matrix" active={activeModule === OmniModule.HEALTH} onClick={()=>setActiveModule(OmniModule.HEALTH)}/>
           <NavItem icon={<BookOpen/>} label="Universal Vault" active={activeModule === OmniModule.VAULT} onClick={()=>setActiveModule(OmniModule.VAULT)}/>
           <NavItem icon={<HelpCircle/>} label="Sovereign Guide" active={activeModule === OmniModule.GUIDE} onClick={()=>setActiveModule(OmniModule.GUIDE)}/>
           <NavItem icon={<Terminal/>} label="System Ledger" active={activeModule === OmniModule.SYSTEM_LEDGER} onClick={()=>setActiveModule(OmniModule.SYSTEM_LEDGER)}/>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-900 px-2 group">
           <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Pulse</span>
           </div>
           <div className="p-3 bg-gray-950 rounded-xl border border-gray-900">
              <p className="text-[9px] font-mono text-blue-400 leading-tight truncate">{logs[0] || 'Ready.'}</p>
           </div>
        </div>
      </nav>

      {/* Main Command Display */}
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
                 <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Compute Environment</p>
                 <p className="text-[10px] font-mono text-blue-400 font-bold">{clientInfo.type}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center font-black text-blue-500">PDS</div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#010204]">
           <div className="max-w-7xl mx-auto space-y-10 pb-40">
              {activeModule === OmniModule.COMMAND_CENTER && (
                <div className="space-y-10 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <StatCard label="Ledger Valuation" value={`$${balances[0]?.amount.toLocaleString() || '0'}`} icon={<CreditCard/>} color="text-blue-400" />
                      <StatCard label="FTS Muscle" value={`${posts.length + transactions.length} Index`} icon={<Database/>} color="text-green-400" />
                      <StatCard label="Client Platform" value={clientInfo.platform} icon={<Cpu/>} color="text-purple-400" />
                      <StatCard label="Health Pulse" value={`${health[0]?.value || 0}%`} icon={<Heart/>} color="text-rose-400" />
                   </div>
                   <div className="p-10 bg-[#080b12] rounded-[3rem] border border-gray-900 shadow-2xl relative overflow-hidden muscle-pulse h-80">
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
              {activeModule === OmniModule.HEALTH && <HealthModule metrics={health} onRefresh={refresh} />}
              {activeModule === OmniModule.GUIDE && <UserGuideModule />}
              {activeModule === OmniModule.SYSTEM_LEDGER && <SystemLedgerModule hwStats={hwStats} logs={logs} clientInfo={clientInfo} />}
           </div>
        </div>
      </main>
    </div>
  );
};

// --- SUB-COMPONENTS ---

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
        <p className="text-gray-400 text-lg leading-relaxed">You are now running a unified PDS (Personal Data Server). This environment consolidates your digital life into a single SQLite-backed muscle, optimized for speed, intelligence, and privacy.</p>
     </div>

     <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <GuideCard title="SQLite Core" desc="Everything is stored in a locally-hosted SQLite ledger. No central clouds, no telemetry leaks. Your data is your muscle." icon={<Database className="text-blue-500" />} />
        <GuideCard title="AI Strategic Vision" desc="Integrated with Gemini 3 Pro. The OS correlates your financial burn with your health trends to provide high-level life strategy." icon={<Sparkles className="text-purple-500" />} />
        <GuideCard title="ATProto Federated" desc="Extend your social reach with AT Protocol integration. Your PDS is resolvable on the wider decentralized web." icon={<Globe className="text-green-500" />} />
     </div>

     <div className="p-12 bg-[#080b12] rounded-[3rem] border border-gray-900">
        <h4 className="text-xl font-black text-white mb-8">The "Muscle" Command Set</h4>
        <div className="space-y-6">
           <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-gray-950 flex items-center justify-center font-bold text-blue-500">01</div>
              <div className="flex-1"><p className="font-bold text-gray-200 text-sm">Universal Search</p><p className="text-gray-500 text-xs">Search every transaction, social post, and note instantly using the FTS5 Engine in the top bar.</p></div>
           </div>
           <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-gray-950 flex items-center justify-center font-bold text-blue-500">02</div>
              <div className="flex-1"><p className="font-bold text-gray-200 text-sm">Bio-Matrix Analysis</p><p className="text-gray-500 text-xs">Track energy and sleep flow. These metrics feed into the AI to determine your peak productivity windows.</p></div>
           </div>
           <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-xl bg-gray-950 flex items-center justify-center font-bold text-blue-500">03</div>
              <div className="flex-1"><p className="font-bold text-gray-200 text-sm">Economic Hub</p><p className="text-gray-500 text-xs">A unified ledger for fiat and decentralized assets. Every commit is validated for ledger integrity.</p></div>
           </div>
        </div>
     </div>
  </div>
);

const GuideCard = ({title, desc, icon}: any) => (
  <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900">
     <div className="mb-6">{icon}</div>
     <h5 className="font-black text-white text-lg mb-2">{title}</h5>
     <p className="text-gray-500 text-sm leading-relaxed">{desc}</p>
  </div>
);

const SystemLedgerModule = ({hwStats, logs, clientInfo}: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-xl">
           <h4 className="text-xs font-black text-blue-500 uppercase tracking-[0.2em] mb-6">Core Environment Sensor</h4>
           <div className="space-y-3 font-mono text-[11px] text-gray-400">
              <div className="flex justify-between border-b border-gray-800 pb-2"><span>Platform</span><span className="text-white">{clientInfo.platform}</span></div>
              <div className="flex justify-between border-b border-gray-800 pb-2"><span>Resolution</span><span className="text-white">{clientInfo.screen}</span></div>
              <div className="flex justify-between border-b border-gray-800 pb-2"><span>Client Type</span><span className="text-blue-400">{clientInfo.type}</span></div>
              <div className="flex justify-between border-b border-gray-800 pb-2"><span>Runtime</span><span className="text-white">{clientInfo.browser}</span></div>
           </div>
        </div>
        <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-xl">
           <h4 className="text-xs font-black text-purple-500 uppercase tracking-[0.2em] mb-6">Backend Node Stats</h4>
           <div className="space-y-3 font-mono text-[11px] text-gray-400">
              <div className="flex justify-between border-b border-gray-800 pb-2"><span>Core Ver</span><span className="text-white">{hwStats?.core || 'Node-3.0'}</span></div>
              <div className="flex justify-between border-b border-gray-800 pb-2"><span>CPU Load</span><span className="text-white">{(hwStats?.system?.load?.[0] || 0.0).toFixed(2)}</span></div>
              <div className="flex justify-between border-b border-gray-800 pb-2"><span>Uptime</span><span className="text-white">{Math.floor(hwStats?.system?.uptime / 3600 || 0)}h</span></div>
           </div>
        </div>
     </div>

     <div className="bg-[#080b12] rounded-[2.5rem] border border-gray-900 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-900 bg-gray-950/30 flex items-center justify-between">
           <h4 className="text-xs font-black text-white uppercase tracking-widest">Event Stream</h4>
        </div>
        <div className="p-8 h-96 overflow-y-auto custom-scrollbar bg-[#010204] font-mono text-[10px] space-y-2">
           {logs.map((log: string, i: number) => (
              <div key={i} className="flex gap-4 border-b border-gray-900/50 pb-2 text-blue-400/80 last:border-0">{log}</div>
           ))}
        </div>
     </div>
  </div>
);

// RE-USED MODULES (Simplified for integrated App.tsx)
const SocialModule = ({posts, onRefresh}: any) => (
  <div className="max-w-2xl mx-auto space-y-4">
     {posts.map((p: any) => (
       <div key={p.id} className="p-6 bg-[#080b12] rounded-3xl border border-gray-900">
          <p className="font-black text-blue-500 text-xs mb-2 uppercase">{p.author}</p>
          <p className="text-gray-300 text-sm">{p.text}</p>
       </div>
     ))}
  </div>
);

const FinanceModule = ({txs, balances}: any) => (
  <div className="space-y-6">
     <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] text-white">
        <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Total Reserve</p>
        <h3 className="text-5xl font-black">${balances[0]?.amount.toLocaleString()}</h3>
     </div>
     <div className="space-y-2">
        {txs.map((t: any) => (
          <div key={t.id} className="p-4 bg-[#080b12] border border-gray-900 rounded-2xl flex justify-between">
             <span className="font-bold text-sm">{t.description}</span>
             <span className={t.type === 'income' ? 'text-green-400 font-bold' : 'text-rose-400 font-bold'}>${t.amount}</span>
          </div>
        ))}
     </div>
  </div>
);

const HealthModule = ({metrics}: any) => (
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
     {metrics.map((m: any) => (
       <div key={m.id} className="p-6 bg-[#080b12] border border-gray-900 rounded-3xl flex justify-between items-center">
          <div><p className="font-black text-white">{m.type}</p><p className="text-[9px] text-gray-600">{m.date.slice(0, 10)}</p></div>
          <p className="text-xl font-black text-blue-500">{m.value}{m.unit}</p>
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
