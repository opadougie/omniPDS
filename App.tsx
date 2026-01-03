
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, Users, Wallet as WalletIcon, Briefcase, Sparkles, Settings, 
  CreditCard, Globe, Copy, Check, Database, Terminal, Zap, BookOpen, UserPlus, 
  Box, Search, X, Activity, Workflow, Radio, MessageSquare, Fingerprint, Image, ListFilter,
  ShieldCheck, Cpu, HardDrive, TrendingUp, Target, Clock, ArrowUpRight, ArrowDownRight,
  Plus, Send, MessageCircle, Repeat2, MoreHorizontal, FileText, Calendar, MapPin, DollarSign,
  AlertCircle, Table as TableIcon, Save, Play, Trash2, FileJson, Heart, Moon, List, Info
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
    // Verify if seeded
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
      {id:'2', author:'prime.ai', text:'Detected metabolic flux in bio-matrix. Recommendation: Optimize circadian rhythm.', likes:5, createdAt: new Date(Date.now()-500000).toISOString()},
      {id:'3', author:'me.pds', text:'Decentralized finance hooks active. Monitoring USDC liquidity pools.', likes:8, createdAt: new Date(Date.now()-900000).toISOString()}
    ];
    demoPosts.forEach(p => db.run("INSERT INTO posts VALUES (?,?,?,?,?)", [p.id, p.author, p.text, p.likes, p.createdAt]));

    const demoTxs = [
      {id:'t1', amount:4250.00, currency:'USD', category:'Income', type:'income', date:new Date().toISOString().split('T')[0], description:'Consulting Settlement', recipient:'Direct'},
      {id:'t2', amount:120.50, currency:'USD', category:'Hardware', type:'expense', date:new Date().toISOString().split('T')[0], description:'GPU Compute Nodes', recipient:'NodeProvider'},
      {id:'t3', amount:85.00, currency:'USD', category:'Subscription', type:'expense', date:new Date().toISOString().split('T')[0], description:'Sovereign SaaS Package', recipient:'CloudStack'}
    ];
    demoTxs.forEach(t => db.run("INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?)", [t.id, t.amount, t.currency, t.category, t.type, t.date, t.description, t.recipient]));

    const demoHealth = [
       {id:'h1', date:new Date().toISOString(), type:'Energy', value:85, unit:'%'},
       {id:'h2', date:new Date(Date.now()-86400000).toISOString(), type:'Energy', value:72, unit:'%'},
       {id:'h3', date:new Date().toISOString(), type:'Sleep', value:7.5, unit:'hrs'}
    ];
    demoHealth.forEach(h => db.run("INSERT INTO health VALUES (?,?,?,?,?)", [h.id, h.date, h.type, h.value, h.unit]));

    const demoTasks = [
       {id:'tk1', title:'Optimize FTS5 Indices', status:'doing', priority:'high'},
       {id:'tk2', title:'Audit Ledger Entropy', status:'todo', priority:'medium'}
    ];
    demoTasks.forEach(tk => db.run("INSERT INTO tasks VALUES (?,?,?,?)", [tk.id, tk.title, tk.status, tk.priority]));

    this.persist();
    this.notifyLog("Synthetic History Committed. Modules Online.");
  },

  ensureFTS() {
    try {
      db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS fts_ledger USING fts5(id UNINDEXED, content, type UNINDEXED);`);
      this.ftsEnabled = true;
      this.notifyLog("FTS5 Engine Primed.");
    } catch(e) { 
      this.ftsEnabled = false;
      this.notifyLog("FTS5 Build Failure. Scaling to LIKE indexing."); 
    }
  },

  async persist() {
    const binary = db.export();
    fetch('/api/pds/persist', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/octet-stream' },
      body: binary 
    }).then(() => this.notifyLog("Ledger Snapshotted to Disk."))
      .catch(() => this.notifyLog("Persistence Drift Detected."));
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
    if (this.ftsEnabled) {
      try { return this.queryAll("SELECT * FROM fts_ledger WHERE fts_ledger MATCH ? ORDER BY rank", [`${term}*`]); } catch (e) {}
    }
    return this.queryAll(`
      SELECT id, text as content, 'SOCIAL' as type FROM posts WHERE text LIKE ?
      UNION ALL
      SELECT id, description as content, 'FINANCE' as type FROM transactions WHERE description LIKE ?
      UNION ALL
      SELECT id, title as content, 'VAULT' as type FROM notes WHERE title LIKE ?
    `, [`%${term}%`, `%${term}%`, `%${term}%`]);
  }
};

// --- MAIN COMPONENT ---
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
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
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
    const ticker = setInterval(async () => {
      try {
        const res = await fetch('/api/health').then(r => r.json());
        setHwStats(res);
      } catch (e) {}
    }, 5000);
    return () => clearInterval(ticker);
  }, []);

  const refresh = () => {
    setPosts(dbService.queryAll<SocialPost>("SELECT * FROM posts ORDER BY createdAt DESC"));
    setTransactions(dbService.queryAll<Transaction>("SELECT * FROM transactions ORDER BY date DESC"));
    setBalances(dbService.queryAll<WalletBalance>("SELECT * FROM balances"));
    setTasks(dbService.queryAll<ProjectTask>("SELECT * FROM tasks"));
    setNotes(dbService.queryAll<Note>("SELECT * FROM notes ORDER BY updatedAt DESC"));
    setHealth(dbService.queryAll<HealthMetric>("SELECT * FROM health ORDER BY date DESC"));
  };

  useEffect(() => {
    if (searchTerm.length > 1) {
      setSearchResults(dbService.universalSearch(searchTerm));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  if (!dbReady) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#010204]">
       <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center animate-spin mb-6 shadow-2xl shadow-blue-500/50">
          <Database className="text-white" size={32} />
       </div>
       <p className="font-black text-blue-500 uppercase tracking-[0.5em] animate-pulse">Mounting Heavy Core</p>
    </div>
  );

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
           <NavItem icon={<Terminal/>} label="System Ledger" active={activeModule === OmniModule.SYSTEM_LEDGER} onClick={()=>setActiveModule(OmniModule.SYSTEM_LEDGER)}/>
        </div>

        <div className="mt-8 pt-6 border-t border-gray-900 px-2 group">
           <div className="flex items-center gap-2 mb-3">
              <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Protocol Pulse</span>
           </div>
           <div className="p-3 bg-gray-950 rounded-xl border border-gray-900 relative overflow-hidden">
              <p className="text-[9px] font-mono text-blue-400 leading-tight truncate">{logs[0] || 'Awaiting Input...'}</p>
              {/* Hover Tooltip for logs */}
              <div className="absolute bottom-full left-0 w-64 bg-gray-900 border border-gray-800 p-4 rounded-2xl shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-[100] mb-2">
                 <h5 className="text-[9px] font-black text-gray-600 uppercase mb-2">Recent Events</h5>
                 {logs.slice(0, 4).map((l, i) => (
                    <p key={i} className="text-[8px] font-mono text-gray-400 mb-1 border-b border-gray-800 last:border-0 pb-1">{l}</p>
                 ))}
              </div>
           </div>
        </div>
      </nav>

      {/* Main Command Display */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 border-b border-gray-900 flex items-center justify-between px-10 glass-panel z-50">
           <div className="relative w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-all" size={18} />
              <input 
                type="text" value={searchTerm} onChange={e=>setSearchTerm(e.target.value)}
                placeholder="Universal Search..." 
                className="w-full bg-[#080b12] border border-gray-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600/30 transition-all text-sm font-medium" 
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-[#080b12] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden z-50 max-h-96 overflow-y-auto">
                   {searchResults.map((res, i) => (
                     <div key={i} className="p-4 hover:bg-gray-900 border-b border-gray-800 last:border-0 cursor-pointer">
                        <p className="text-xs font-bold text-gray-300">{res.content}</p>
                        <span className="text-[9px] font-black text-blue-500 uppercase">{res.type}</span>
                     </div>
                   ))}
                </div>
              )}
           </div>
           <div className="flex items-center gap-8">
              <div className="text-right hidden sm:block">
                 <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">CPU Load</p>
                 <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-gray-900 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{width: `${(hwStats?.system?.load?.[0] || 0) * 10}%`}}></div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">{(hwStats?.system?.load?.[0] || 0.0).toFixed(2)}</span>
                 </div>
              </div>
              <div className="w-10 h-10 rounded-xl bg-gray-950 border border-gray-800 flex items-center justify-center font-black text-blue-500 shadow-inner">
                PDS
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-10 bg-[#010204]">
           <div className="max-w-7xl mx-auto space-y-10 pb-40">
              {activeModule === OmniModule.COMMAND_CENTER && (
                <div className="space-y-10 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <StatCard label="Ledger Valuation" value={`$${balances[0]?.amount.toLocaleString() || '0'}`} icon={<CreditCard/>} color="text-blue-400" />
                      <StatCard label="Data Density" value={`${posts.length + transactions.length + tasks.length + notes.length} Items`} icon={<Database/>} color="text-green-400" />
                      <StatCard label="Uptime" value={`${Math.floor(hwStats?.system?.uptime / 3600 || 0)}h Active`} icon={<Clock/>} color="text-purple-400" />
                      <StatCard label="Health Pulse" value={`${health[0]?.value || 0}%`} icon={<Heart/>} color="text-rose-400" />
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8 p-10 bg-[#080b12] rounded-[3rem] border border-gray-900 shadow-2xl relative overflow-hidden muscle-pulse">
                         <h3 className="text-2xl font-black text-white tracking-tight mb-8">System Telemetry</h3>
                         <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={[{n:'01',v:40},{n:'02',v:30},{n:'03',v:60},{n:'04',v:50},{n:'05',v:80},{n:'06',v:70},{n:'07',v:85}]}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.3} />
                                  <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.1} />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                      <div className="lg:col-span-4 space-y-6">
                         <div className="p-8 bg-[#080b12] border border-gray-900 rounded-[2.5rem] h-full flex flex-col">
                            <h4 className="font-black text-white mb-6 uppercase text-xs tracking-widest flex items-center gap-2">
                               <List size={14} className="text-blue-500" /> Live Firehose
                            </h4>
                            <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2 max-h-[400px]">
                               {[...posts, ...transactions].slice(0, 10).map((item: any, i) => (
                                 <div key={i} className="p-4 bg-gray-950/50 rounded-2xl border border-gray-900 group hover:border-gray-700 transition-all cursor-default">
                                    <p className="text-xs font-bold text-gray-300 truncate">{item.text || item.description}</p>
                                    <span className="text-[9px] font-black text-blue-500/70 uppercase mt-2 block tracking-widest">{item.createdAt ? 'SOCIAL' : 'FINANCE'}</span>
                                 </div>
                               ))}
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeModule === OmniModule.SOCIAL && <SocialModule posts={posts} onRefresh={refresh} />}
              {activeModule === OmniModule.FINANCE && <FinanceModule txs={transactions} balances={balances} onRefresh={refresh} />}
              {activeModule === OmniModule.PROJECTS && <ProjectModule tasks={tasks} onRefresh={refresh} />}
              {activeModule === OmniModule.HEALTH && <HealthModule metrics={health} onRefresh={refresh} />}
              {activeModule === OmniModule.VAULT && <VaultModule notes={notes} onRefresh={refresh} />}
              {activeModule === OmniModule.SYSTEM_LEDGER && <SystemLedgerModule hwStats={hwStats} logs={logs} />}
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
       <form onSubmit={submit} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-2xl">
          <textarea value={input} onChange={e=>setInput(e.target.value)} placeholder="What's on your decentralized mind?" className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder-gray-700 h-24" />
          <div className="flex justify-end mt-4"><button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all">Broadcast</button></div>
       </form>
       <div className="space-y-4">
          {posts.map((p: any) => (
            <div key={p.id} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 hover:border-gray-800 transition-all shadow-md group">
               <div className="flex gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gray-950 flex items-center justify-center font-bold text-blue-500 border border-gray-900">{p.author[0]}</div>
                  <div className="flex-1">
                     <p className="font-black text-white text-sm mb-1">{p.author} <span className="text-[9px] text-gray-600 ml-2">{p.createdAt.slice(11,16)}</span></p>
                     <p className="text-gray-300 leading-relaxed text-sm">{p.text}</p>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const FinanceModule = ({txs, balances, onRefresh}: any) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const submit = (e: any) => {
    e.preventDefault();
    if (!amount || !desc) return;
    dbService.queryAll(`INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?)`, [Date.now().toString(), parseFloat(amount), 'USD', 'Manual', 'expense', new Date().toISOString().split('T')[0], desc, 'Self']);
    dbService.queryAll(`UPDATE balances SET amount = amount - ? WHERE currency = 'USD'`, [parseFloat(amount)]);
    dbService.persist(); setAmount(''); setDesc(''); onRefresh();
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-500">
       <div className="lg:col-span-2 space-y-8">
          <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <p className="text-blue-100 text-sm font-medium mb-1 uppercase tracking-widest text-[10px]">Total Liquid Reserve</p>
                <h3 className="text-5xl font-black tracking-tighter text-white">${balances[0]?.amount.toLocaleString()}</h3>
             </div>
          </div>
          <div className="bg-[#080b12] rounded-[2.5rem] border border-gray-900 p-8 shadow-xl">
             <h4 className="font-black text-white mb-8 uppercase text-[10px] tracking-widest">Entry Ledger</h4>
             <div className="space-y-2">
                {txs.map((t: any) => (
                  <div key={t.id} className="p-4 bg-gray-950/50 rounded-2xl border border-gray-900 flex justify-between items-center group hover:bg-gray-900 transition-all">
                     <div><p className="font-bold text-sm text-gray-200">{t.description}</p><p className="text-[9px] text-gray-600 font-black uppercase tracking-widest">{t.date}</p></div>
                     <p className={`font-black text-sm ${t.type === 'income' ? 'text-green-400' : 'text-rose-400'}`}>{t.type === 'income' ? '+' : '-'}${t.amount}</p>
                  </div>
                ))}
             </div>
          </div>
       </div>
       <form onSubmit={submit} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-2xl space-y-4 h-fit">
          <h4 className="text-[10px] font-black mb-6 text-white uppercase tracking-widest">Authorize Transaction</h4>
          <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 font-mono font-bold text-xl text-blue-400 outline-none" />
          <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Memo..." className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-3 text-sm" />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-blue-900/30">Commit Transaction</button>
       </form>
    </div>
  );
};

const ProjectModule = ({tasks, onRefresh}: any) => {
  const [input, setInput] = useState('');
  const submit = (e: any) => {
    e.preventDefault();
    if (!input.trim()) return;
    dbService.queryAll(`INSERT INTO tasks VALUES (?,?,?,?)`, [Date.now().toString(), input, 'todo', 'medium']);
    dbService.persist(); setInput(''); onRefresh();
  };
  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-500">
       <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 flex gap-4 shadow-xl">
          <input type="text" value={input} onChange={e=>setInput(e.target.value)} placeholder="New Mission Objective..." className="flex-1 bg-transparent border-none focus:ring-0 text-lg font-bold placeholder-gray-700" />
          <button onClick={submit} className="bg-blue-600 px-8 py-2 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-900/30">Add Task</button>
       </div>
       <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tasks.map((t: any) => (
            <div key={t.id} className="p-6 bg-[#080b12] rounded-[2.2rem] border border-gray-900 group hover:border-gray-700 transition-all flex items-center justify-between shadow-md">
               <div className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full border-2 border-gray-800 group-hover:border-blue-500 transition-colors"></div>
                  <p className="font-bold text-gray-200">{t.title}</p>
               </div>
               <span className="text-[9px] font-black uppercase text-gray-600 tracking-widest">{t.priority}</span>
            </div>
          ))}
       </div>
    </div>
  );
};

const HealthModule = ({metrics, onRefresh}: any) => {
  const [val, setVal] = useState('');
  const [type, setType] = useState('Energy');
  const submit = (e: any) => {
    e.preventDefault();
    if (!val) return;
    dbService.queryAll(`INSERT INTO health VALUES (?,?,?,?,?)`, [Date.now().toString(), new Date().toISOString(), type, parseFloat(val), type === 'Energy' ? '%' : 'hrs']);
    dbService.persist(); setVal(''); onRefresh();
  };
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-xl">
             <h4 className="font-black text-white mb-8 text-[10px] uppercase tracking-widest">Bio-Trend Flow</h4>
             <div className="h-48 w-full">
                <ResponsiveContainer width="100%" height="100%">
                   <LineChart data={metrics.slice(0, 10).reverse().map((m: any) => ({n: m.date.slice(11, 16), v: m.value}))}>
                      <Line type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={4} dot={false} />
                   </LineChart>
                </ResponsiveContainer>
             </div>
          </div>
          <div className="md:col-span-2 space-y-4">
             {metrics.slice(0, 5).map((m: any) => (
               <div key={m.id} className="p-6 bg-[#080b12] rounded-[2rem] border border-gray-900 flex justify-between items-center group shadow-md">
                  <div className="flex items-center gap-4">
                     <div className="p-3 bg-gray-950 rounded-xl text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-all"><Activity size={20}/></div>
                     <div><p className="font-black text-white">{m.type}</p><p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">{m.date.slice(0, 10)}</p></div>
                  </div>
                  <p className="text-xl font-black text-white">{m.value}<span className="text-xs text-gray-600 ml-1 font-normal uppercase">{m.unit}</span></p>
               </div>
             ))}
          </div>
       </div>
       <form onSubmit={submit} className="p-8 bg-[#080b12] border border-gray-900 rounded-[2.5rem] flex gap-4 shadow-xl">
          <select value={type} onChange={e=>setType(e.target.value)} className="bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm flex-1 focus:ring-1 focus:ring-blue-500 outline-none">
             <option>Energy</option>
             <option>Sleep</option>
             <option>Weight</option>
          </select>
          <input type="number" value={val} onChange={e=>setVal(e.target.value)} placeholder="0.0" className="bg-gray-950 border border-gray-800 rounded-2xl px-4 py-3 text-sm flex-1 focus:ring-1 focus:ring-blue-500 outline-none" />
          <button type="submit" className="bg-blue-600 px-8 py-3 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-blue-900/30">Commit Bio-Data</button>
       </form>
    </div>
  );
};

const VaultModule = ({notes, onRefresh}: any) => {
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const submit = (e: any) => {
    e.preventDefault();
    if (!title || !body) return;
    dbService.queryAll(`INSERT INTO notes VALUES (?,?,?,?,?)`, [Date.now().toString(), title, body, 'Universal', new Date().toISOString()]);
    dbService.persist(); setTitle(''); setBody(''); onRefresh();
  };
  return (
    <div className="space-y-10 animate-in slide-in-from-bottom-6 duration-500">
       <form onSubmit={submit} className="p-10 bg-[#080b12] rounded-[3rem] border border-gray-900 shadow-2xl space-y-4">
          <input value={title} onChange={e=>setTitle(e.target.value)} placeholder="Knowledge Header..." className="w-full bg-transparent border-none text-2xl font-black placeholder-gray-800 focus:ring-0" />
          <textarea value={body} onChange={e=>setBody(e.target.value)} placeholder="Encrypt knowledge into ledger stream..." className="w-full bg-transparent border-none text-gray-400 h-32 focus:ring-0 resize-none" />
          <div className="flex justify-end"><button type="submit" className="bg-blue-600 px-10 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-blue-900/30">Secure Entry</button></div>
       </form>
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {notes.map((n: any) => (
            <div key={n.id} className="p-8 bg-[#080b12] border border-gray-900 rounded-[2.5rem] hover:border-gray-700 transition-all group shadow-lg">
               <h5 className="font-black text-white text-lg mb-2 truncate uppercase tracking-tighter">{n.title}</h5>
               <p className="text-gray-500 text-sm line-clamp-3 mb-6">{n.content}</p>
               <div className="flex justify-between items-center text-[9px] font-black uppercase tracking-widest text-gray-600">
                  <span>{n.updatedAt.slice(0, 10)}</span>
                  <span className="text-blue-500 font-mono">DECRYPTED</span>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const SystemLedgerModule = ({hwStats, logs}: any) => (
  <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
     <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-xl group hover:border-blue-500/20 transition-all">
           <Terminal className="text-blue-500 mb-6 group-hover:scale-110 transition-transform" size={32} />
           <h4 className="text-xl font-black text-white mb-2 tracking-tight">Protocol Node</h4>
           <p className="text-gray-500 text-xs font-mono">{hwStats?.core || 'omnipds-3.0.0-heavy'}</p>
        </div>
        <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-xl group hover:border-purple-500/20 transition-all">
           <Cpu className="text-purple-500 mb-6 group-hover:scale-110 transition-transform" size={32} />
           <h4 className="text-xl font-black text-white mb-2 tracking-tight">Compute Load</h4>
           <p className="text-gray-500 text-xs font-mono">{(hwStats?.system?.load?.[0] || 0.0).toFixed(2)} / {hwStats?.system?.cpus || 0} Cores</p>
        </div>
        <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-xl group hover:border-amber-500/20 transition-all">
           <HardDrive className="text-amber-500 mb-6 group-hover:scale-110 transition-transform" size={32} />
           <h4 className="text-xl font-black text-white mb-2 tracking-tight">Ledger Integrity</h4>
           <p className="text-gray-500 text-xs font-mono uppercase">Verified Protocol 1.1</p>
        </div>
     </div>

     <div className="bg-[#080b12] rounded-[2.5rem] border border-gray-900 overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-gray-900 bg-gray-950/30 flex items-center justify-between">
           <h4 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2">
              <Activity size={14} className="text-blue-500" /> Event Stream (Log Info)
           </h4>
           <div className="flex gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
              <span className="text-[10px] font-bold text-gray-600 uppercase">Live Output</span>
           </div>
        </div>
        <div className="p-8 h-96 overflow-y-auto custom-scrollbar bg-[#010204] font-mono text-xs space-y-2">
           {logs.map((log: string, i: number) => (
              <div key={i} className="flex gap-4 border-b border-gray-900/50 pb-2 last:border-0 hover:bg-gray-900/20 transition-all">
                 <span className="text-gray-700 shrink-0">[{logs.length - i}]</span>
                 <span className={`${log.includes('Commit') || log.includes('Synced') ? 'text-green-400' : log.includes('Failure') ? 'text-rose-400' : 'text-blue-400/80'}`}>{log}</span>
              </div>
           ))}
           {logs.length === 0 && (
              <div className="h-full flex items-center justify-center text-gray-800 italic">
                 Awaiting Protocol Initialization...
              </div>
           )}
        </div>
     </div>
  </div>
);

// MOUNT
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}
