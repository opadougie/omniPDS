import React, { useState, useEffect, useMemo, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import { 
  LayoutDashboard, Users, Wallet as WalletIcon, Briefcase, Sparkles, Settings, 
  CreditCard, Globe, Copy, Check, Database, Terminal, Zap, BookOpen, UserPlus, 
  Box, Search, X, Activity, Workflow, Radio, MessageSquare, Fingerprint, Image, ListFilter,
  ShieldCheck, Cpu, HardDrive, TrendingUp, Target, Clock, ArrowUpRight, ArrowDownRight,
  Plus, Send, MessageCircle, Repeat2, MoreHorizontal, FileText, Calendar, MapPin, DollarSign,
  AlertCircle, Table as TableIcon, Save, Play, Trash2, FileJson
} from 'lucide-react';
import { GoogleGenAI, Type } from "@google/genai";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

// --- TYPE DEFINITIONS ---
enum OmniModule {
  COMMAND_CENTER = 'COMMAND_CENTER',
  SOCIAL = 'SOCIAL',
  FINANCE = 'FINANCE',
  PROJECTS = 'PROJECTS',
  INSIGHTS = 'INSIGHTS',
  WALLET = 'WALLET',
  SYSTEM_LEDGER = 'SYSTEM_LEDGER',
  VAULT = 'VAULT',
  PULSE = 'PULSE',
  INVENTORY = 'INVENTORY',
  HEALTH = 'HEALTH',
  WORKFLOWS = 'WORKFLOWS',
  COMMS = 'COMMS',
  CREDENTIALS = 'CREDENTIALS',
  MEDIA = 'MEDIA'
}

interface SocialPost { id: string; author: string; text: string; likes: number; createdAt: string; }
interface Transaction { id: string; amount: number; currency: string; category: string; type: 'income' | 'expense'; date: string; description: string; recipient?: string; }
interface WalletBalance { currency: string; amount: number; symbol: string; label: string; }
interface ProjectTask { id: string; title: string; status: 'todo' | 'doing' | 'done'; priority: 'low' | 'medium' | 'high'; }
interface Note { id: string; title: string; content: string; tags: string; updatedAt: string; }

// --- DATABASE SERVICE MUSCLE ---
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
        this.notifyLog("Sovereign Ledger Synced: Heavy Core Ready.");
      } else { throw new Error("Fresh start"); }
    } catch (e) {
      db = new SQL.Database();
      this.createSchema();
    }
    this.ensureFTS();
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
      CREATE TABLE IF NOT EXISTS contacts (id TEXT PRIMARY KEY, name TEXT, handle TEXT, category TEXT, lastContacted TEXT, notes TEXT);
      CREATE TABLE IF NOT EXISTS assets (id TEXT PRIMARY KEY, name TEXT, serial TEXT, value REAL, category TEXT, location TEXT, purchaseDate TEXT);
      
      INSERT OR IGNORE INTO balances VALUES ('USD', 12760.75, '$', 'Main Ledger');
      INSERT OR IGNORE INTO balances VALUES ('BTC', 0.12, '₿', 'Sovereign Vault');
    `);
    this.persist();
  },

  ensureFTS() {
    try {
      db.run(`CREATE VIRTUAL TABLE IF NOT EXISTS fts_ledger USING fts5(id UNINDEXED, content, type UNINDEXED);`);
      this.ftsEnabled = true;
      this.notifyLog("FTS5 Muscle Activated.");
    } catch(e) { 
      this.ftsEnabled = false;
      this.notifyLog("FTS5 Unsupported. Using LIKE Fallback."); 
    }
  },

  async persist() {
    const binary = db.export();
    // CRITICAL: Explicitly set Content-Type so server's bodyParser.raw can identify the stream
    fetch('/api/pds/persist', { 
      method: 'POST', 
      headers: { 'Content-Type': 'application/octet-stream' },
      body: binary 
    });
  },

  // Defined as a method to ensure generic type inference works correctly within the object
  queryAll<T>(sql: string, params: any[] = []): T[] {
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
      try {
        // Fix: Removed <any> to prevent "Untyped function calls" error when 'this' might be inferred as 'any'
        return this.queryAll("SELECT * FROM fts_ledger WHERE fts_ledger MATCH ? ORDER BY rank", [`${term}*`]);
      } catch (e) { /* fallback */ }
    }
    // Fix: Removed <any> from fallback search to prevent "Untyped function calls" error
    return this.queryAll(`
      SELECT id, text as content, 'SOCIAL' as type FROM posts WHERE text LIKE ?
      UNION ALL
      SELECT id, description as content, 'FINANCE' as type FROM transactions WHERE description LIKE ?
      UNION ALL
      SELECT id, title as content, 'VAULT' as type FROM notes WHERE title LIKE ?
    `, [`%${term}%`, `%${term}%`, `%${term}%`]);
  },

  addPost(p: SocialPost) { 
    db.run("INSERT INTO posts VALUES (?,?,?,?,?)", [p.id, p.author, p.text, p.likes, p.createdAt]); 
    if (this.ftsEnabled) db.run("INSERT INTO fts_ledger VALUES (?,?,?)", [p.id, p.text, 'SOCIAL']);
    this.persist(); 
  },

  addTransaction(t: Transaction) {
    db.run("INSERT INTO transactions VALUES (?,?,?,?,?,?,?,?)", [t.id, t.amount, t.currency, t.category, t.type, t.date, t.description, t.recipient || '']);
    db.run("UPDATE balances SET amount = amount " + (t.type === 'income' ? '+' : '-') + " ? WHERE currency = ?", [t.amount, t.currency]);
    if (this.ftsEnabled) db.run("INSERT INTO fts_ledger VALUES (?,?,?)", [t.id, t.description, 'FINANCE']);
    this.persist();
  }
};

// --- GEMINI SERVICE ---
const aiService = {
  async getInsights(data: any) {
    // Correct usage of process.env.API_KEY as per guidelines
    if (!process.env.API_KEY) return { insights: [] };
    const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const res = await genAI.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: `Analyze life data: ${JSON.stringify(data)}. Return 3 strategic insights in JSON.`,
      config: { responseMimeType: "application/json", responseSchema: {
        type: Type.OBJECT,
        properties: {
          insights: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: {
            title: {type: Type.STRING}, description: {type: Type.STRING}, impact: {type: Type.STRING}
          }}}
        }
      }}
    });
    // Use .text property directly
    return JSON.parse(res.text || '{"insights":[]}');
  }
};

// --- MAIN APP COMPONENT ---
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
  
  useEffect(() => {
    dbService.onLog(msg => setLogs(prev => [msg, ...prev].slice(0, 5)));
    const boot = async () => {
      await dbService.init();
      const hRes = await fetch('/api/health').then(r => r.json());
      setHwStats(hRes);
      refresh();
      setDbReady(true);
    };
    boot();
    const tick = setInterval(async () => {
      try {
        const res = await fetch('/api/health').then(r => r.json());
        setHwStats(res);
      } catch (e) {}
    }, 5000);
    return () => clearInterval(tick);
  }, []);

  useEffect(() => {
    if (searchTerm.length > 1) {
      setSearchResults(dbService.universalSearch(searchTerm));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const refresh = () => {
    setPosts(dbService.queryAll<SocialPost>("SELECT * FROM posts ORDER BY createdAt DESC"));
    setTransactions(dbService.queryAll<Transaction>("SELECT * FROM transactions ORDER BY date DESC"));
    setBalances(dbService.queryAll<WalletBalance>("SELECT * FROM balances"));
    setTasks(dbService.queryAll<ProjectTask>("SELECT * FROM tasks"));
  };

  if (!dbReady) return (
    <div className="h-screen flex flex-col items-center justify-center bg-[#02040a]">
       <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center animate-spin mb-6 shadow-2xl shadow-blue-500/50">
          <Database className="text-white" size={32} />
       </div>
       <p className="font-black text-blue-500 uppercase tracking-[0.5em] animate-pulse">Mounting Heavy Core</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#02040a] text-gray-100 font-sans overflow-hidden">
      {/* Sidebar */}
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
           <NavItem icon={<MessageSquare/>} label="Comms Hub" active={activeModule === OmniModule.COMMS} onClick={()=>setActiveModule(OmniModule.COMMS)}/>
           <NavItem icon={<Activity/>} label="Bio-Matrix" active={activeModule === OmniModule.HEALTH} onClick={()=>setActiveModule(OmniModule.HEALTH)}/>
           <NavItem icon={<Sparkles/>} label="Strategic AI" active={activeModule === OmniModule.INSIGHTS} onClick={()=>setActiveModule(OmniModule.INSIGHTS)}/>
           <div className="h-4"></div>
           <NavItem icon={<CreditCard/>} label="E-Wallet" active={activeModule === OmniModule.WALLET} onClick={()=>setActiveModule(OmniModule.WALLET)}/>
           <NavItem icon={<Briefcase/>} label="Mission Control" active={activeModule === OmniModule.PROJECTS} onClick={()=>setActiveModule(OmniModule.PROJECTS)}/>
           <NavItem icon={<BookOpen/>} label="Vault" active={activeModule === OmniModule.VAULT} onClick={()=>setActiveModule(OmniModule.VAULT)}/>
           <div className="h-4"></div>
           <NavItem icon={<Users/>} label="Social" active={activeModule === OmniModule.SOCIAL} onClick={()=>setActiveModule(OmniModule.SOCIAL)}/>
           <NavItem icon={<Terminal/>} label="System Ledger" active={activeModule === OmniModule.SYSTEM_LEDGER} onClick={()=>setActiveModule(OmniModule.SYSTEM_LEDGER)}/>
        </div>

        <div className="mt-8 pt-8 border-t border-gray-900 px-2">
           <div className="flex items-center gap-2 mb-4">
              <span className={`w-2 h-2 rounded-full ${dbReady ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}></span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Core Online</span>
           </div>
           <p className="text-[9px] font-mono text-blue-400/70 truncate">{logs[0] || 'Node Initialized.'}</p>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden bg-[#02040a]">
        <header className="h-20 border-b border-gray-900 flex items-center justify-between px-10 glass-panel z-50">
           <div className="relative w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-all" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Universal Search..." 
                className="w-full bg-[#080b12] border border-gray-800 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600/30 transition-all text-sm font-medium placeholder-gray-700" 
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-[#080b12] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden z-50">
                  {searchResults.map((res, i) => (
                    <button key={i} className="w-full flex items-center gap-4 px-6 py-4 hover:bg-blue-600/10 border-b border-gray-800/50 last:border-0 transition-all text-left">
                       <div className="p-2 bg-gray-900 rounded-lg text-blue-400"><Database size={14}/></div>
                       <div>
                          <p className="font-bold text-sm text-gray-100">{res.content}</p>
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{res.type}</span>
                       </div>
                    </button>
                  ))}
                </div>
              )}
           </div>
           <div className="flex items-center gap-8">
              <div className="text-right hidden sm:block">
                 <p className="text-[9px] font-black text-gray-600 uppercase tracking-widest mb-1">Compute Load</p>
                 <div className="flex items-center gap-2">
                    <div className="w-24 h-1 bg-gray-900 rounded-full overflow-hidden">
                       <div className="h-full bg-blue-500" style={{width: `${(hwStats?.system?.load?.[0] || 0) * 10}%`}}></div>
                    </div>
                    <span className="text-[10px] font-mono text-blue-400 font-bold">{(hwStats?.system?.load?.[0] || 0.0).toFixed(2)}</span>
                 </div>
              </div>
              <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center overflow-hidden">
                 <img src="https://picsum.photos/seed/pds/100/100" alt="Avatar" className="w-full h-full object-cover opacity-80" />
              </div>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
           <div className="p-10 max-w-7xl mx-auto pb-40">
              {activeModule === OmniModule.COMMAND_CENTER && (
                <div className="space-y-10 animate-in fade-in duration-500">
                   <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                      <StatCard label="Ledger Valuation" value={`$${balances[0]?.amount.toLocaleString() || '0'}`} icon={<CreditCard/>} color="text-blue-400" />
                      <StatCard label="Data Index" value={dbService.ftsEnabled ? "FTS5 Active" : "LIKE Fallback"} icon={<Database/>} color="text-green-400" />
                      <StatCard label="System Load" value={`${hwStats?.system?.cpus || 0} Cores`} icon={<Cpu/>} color="text-purple-400" />
                      <StatCard label="Memory Matrix" value={`${(hwStats?.system?.freeMem / 1024 / 1024 / 1024 || 0).toFixed(1)}GB Free`} icon={<HardDrive/>} color="text-amber-400" />
                   </div>

                   <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                      <div className="lg:col-span-8 p-10 bg-[#080b12] rounded-[3rem] border border-gray-900 shadow-2xl relative overflow-hidden muscle-pulse">
                         <div className="flex items-center justify-between mb-10">
                            <div>
                               <h3 className="text-2xl font-black text-white tracking-tight">Node Telemetry Graph</h3>
                               <p className="text-gray-500 text-sm">Real-time performance from Sovereign Node Cluster.</p>
                            </div>
                         </div>
                         <div className="h-80 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               <AreaChart data={[{n:'01',v:40},{n:'02',v:30},{n:'03',v:60},{n:'04',v:50},{n:'05',v:80}]}>
                                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.3} />
                                  <Area type="monotone" dataKey="v" stroke="#3b82f6" strokeWidth={3} fill="#3b82f6" fillOpacity={0.1} />
                               </AreaChart>
                            </ResponsiveContainer>
                         </div>
                      </div>
                      <div className="lg:col-span-4 p-8 bg-[#080b12] border border-gray-900 rounded-[2.5rem] flex flex-col h-[520px]">
                         <h4 className="text-lg font-black mb-8 flex items-center justify-between">
                            Recent Events
                            <span className="text-[9px] font-black text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full uppercase tracking-widest">Sovereign</span>
                         </h4>
                         <div className="flex-1 overflow-y-auto space-y-4 custom-scrollbar pr-2">
                            {transactions.slice(0, 5).map(t => (
                              <div key={t.id} className="p-4 bg-gray-950/50 rounded-2xl border border-gray-900 group hover:border-gray-700 transition-all">
                                 <p className="text-xs font-bold text-gray-300">{t.description}</p>
                                 <div className="flex items-center justify-between mt-2">
                                    <span className="text-[9px] font-black text-blue-400 uppercase">{t.category}</span>
                                    <span className={`text-[10px] font-mono font-bold ${t.type === 'income' ? 'text-green-400' : 'text-rose-400'}`}>
                                       {t.type === 'income' ? '+' : '-'}${t.amount}
                                    </span>
                                 </div>
                              </div>
                            ))}
                         </div>
                      </div>
                   </div>
                </div>
              )}

              {activeModule === OmniModule.SOCIAL && <SocialModule posts={posts} onAdd={refresh}/>}
              {activeModule === OmniModule.FINANCE && <FinanceModule txs={transactions} balances={balances} onAdd={refresh}/>}
              {activeModule === OmniModule.SYSTEM_LEDGER && <SystemLedgerModule hwStats={hwStats} onAdd={refresh}/>}
           </div>
        </div>
      </main>
    </div>
  );
};

// --- COMPONENTS ---
const NavItem = ({icon, label, active, onClick}: any) => (
  <button onClick={onClick} className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl transition-all group ${active ? 'bg-blue-600 text-white shadow-xl shadow-blue-900/30' : 'text-gray-500 hover:bg-gray-800/40 hover:text-white'}`}>
     <div className={`${active ? 'text-white' : 'text-gray-500 group-hover:text-blue-400'} transition-colors`}>{React.cloneElement(icon, {size:20})}</div>
     <span className="font-bold text-sm">{label}</span>
  </button>
);

const StatCard = ({label, value, icon, color}: any) => (
  <div className="p-6 bg-[#080b12] rounded-[2rem] border border-gray-900 group hover:border-blue-500/20 transition-all">
     <div className={`mb-4 ${color} group-hover:scale-110 transition-transform`}>{React.cloneElement(icon, {size:24})}</div>
     <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">{label}</p>
     <h4 className="text-2xl font-black mt-1 text-white">{value}</h4>
  </div>
);

const SocialModule = ({posts, onAdd}: any) => {
  const [text, setText] = useState('');
  const submit = (e: any) => {
    e.preventDefault();
    if (!text.trim()) return;
    dbService.addPost({id:Date.now().toString(), author:'me.pds', text, likes:0, createdAt:new Date().toISOString()});
    setText(''); onAdd();
  };
  return (
    <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-bottom-6 duration-500">
       <form onSubmit={submit} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-xl">
          <textarea value={text} onChange={e=>setText(e.target.value)} placeholder="What's happening in your decentralized consciousness?" className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder-gray-700 h-24" />
          <div className="flex justify-between items-center mt-6 pt-6 border-t border-gray-900">
             <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ml-auto">Broadcast</button>
          </div>
       </form>
       <div className="space-y-4">
          {posts.map((p: any) => (
            <div key={p.id} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 hover:border-gray-800 transition-all group">
               <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-gray-900 border border-gray-800 flex items-center justify-center font-black text-blue-500">{p.author[0]}</div>
                  <div className="flex-1">
                     <div className="flex justify-between items-center mb-2">
                        <span className="font-black text-white">{p.author}</span>
                        <span className="text-[10px] text-gray-600 font-mono">{p.createdAt.slice(11,16)}</span>
                     </div>
                     <p className="text-gray-300 leading-relaxed">{p.text}</p>
                  </div>
               </div>
            </div>
          ))}
       </div>
    </div>
  );
};

const FinanceModule = ({txs, balances, onAdd}: any) => {
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'income' | 'expense'>('expense');
  const submit = (e: any) => {
    e.preventDefault();
    if (!amount || !desc) return;
    dbService.addTransaction({id:Date.now().toString(), amount:parseFloat(amount), currency:'USD', category:'Transfer', type, date:new Date().toISOString().split('T')[0], description:desc});
    setAmount(''); setDesc(''); onAdd();
  };
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-bottom-6 duration-500">
       <div className="lg:col-span-2 space-y-8">
          <div className="p-10 bg-gradient-to-br from-blue-600 to-indigo-800 rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <p className="text-blue-100 text-sm font-medium mb-1">Total Sovereign Liquidity</p>
                <h3 className="text-5xl font-black tracking-tighter text-white mb-10">${balances[0]?.amount.toLocaleString()}</h3>
             </div>
          </div>
          <div className="bg-[#080b12] rounded-[2.5rem] border border-gray-900 p-8">
             <h4 className="font-black text-white mb-8">Activity Ledger</h4>
             <div className="space-y-3">
                {txs.map((t: any) => (
                  <div key={t.id} className="p-5 bg-gray-950/50 rounded-2xl border border-gray-900 flex justify-between items-center group hover:bg-gray-900/50 transition-all">
                     <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
                           {t.type === 'income' ? <ArrowUpRight size={18}/> : <ArrowDownRight size={18}/>}
                        </div>
                        <div><p className="font-bold text-sm text-gray-200">{t.description}</p><p className="text-[10px] text-gray-600 font-black uppercase tracking-widest">{t.date}</p></div>
                     </div>
                     <p className={`font-black text-sm ${t.type === 'income' ? 'text-green-400' : 'text-rose-400'}`}>{t.type === 'income' ? '+' : '-'}${t.amount}</p>
                  </div>
                ))}
             </div>
          </div>
       </div>
       <div className="space-y-6">
          <form onSubmit={submit} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-xl space-y-4">
             <h4 className="text-lg font-black mb-6 text-white">Authorize Entry</h4>
             <input type="number" value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0.00" className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 font-mono font-bold text-xl text-blue-400 outline-none focus:ring-2 focus:ring-blue-600/30" />
             <div className="flex bg-gray-950 rounded-2xl p-1 border border-gray-800">
                <button type="button" onClick={()=>setType('income')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${type === 'income' ? 'bg-green-600 text-white' : 'text-gray-500'}`}>Income</button>
                <button type="button" onClick={()=>setType('expense')} className={`flex-1 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${type === 'expense' ? 'bg-rose-600 text-white' : 'text-gray-500'}`}>Expense</button>
             </div>
             <input type="text" value={desc} onChange={e=>setDesc(e.target.value)} placeholder="Transaction Description..." className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-3 text-sm" />
             <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] shadow-xl shadow-blue-900/30 transition-all">Commit Entry</button>
          </form>
       </div>
    </div>
  );
};

const SystemLedgerModule = ({hwStats}: any) => {
  return (
    <div className="space-y-8 animate-in slide-in-from-bottom-6 duration-500">
       <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 group hover:border-blue-500/20 transition-all">
             <Terminal className="text-blue-500 mb-6" size={32} />
             <h4 className="text-xl font-black text-white mb-2">Protocol Node</h4>
             <p className="text-gray-500 text-xs font-mono mb-4">{hwStats?.core || 'Node-3.0'}</p>
             <div className="flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span><span className="text-[10px] font-black text-gray-600 uppercase">Sovereign Running</span></div>
          </div>
       </div>
    </div>
  );
};

// MOUNT
const rootEl = document.getElementById('root');
if (rootEl) {
  const root = createRoot(rootEl);
  root.render(<App />);
}