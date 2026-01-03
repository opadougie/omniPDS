
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Wallet as WalletIcon, Briefcase, Sparkles, Settings, 
  CreditCard, Globe, Copy, Check, Database, Terminal, Zap, BookOpen, UserPlus, 
  Box, Search, X, Activity, Workflow, Radio, MessageSquare, Fingerprint, Image, ListFilter
} from 'lucide-react';
import { OmniModule, SocialPost, Transaction, ProjectTask, WalletBalance, Note, Contact, Asset, HealthMetric, WorkflowRule } from './types';
import SidebarItem from './components/SidebarItem';
import SocialModule from './components/SocialModule';
import FinanceModule from './components/FinanceModule';
import ProjectModule from './components/ProjectModule';
import InsightsModule from './components/InsightsModule';
import DashboardModule from './components/DashboardModule';
import WalletModule from './components/WalletModule';
import SystemLedgerModule from './components/SystemLedgerModule';
import VaultModule from './components/VaultModule';
import PulseModule from './components/PulseModule';
import InventoryModule from './components/InventoryModule';
import HealthModule from './components/HealthModule';
import WorkflowModule from './components/WorkflowModule';
import CommandCenter from './components/CommandCenter';
import CommsModule from './components/CommsModule';
import IdentityModule from './components/IdentityModule';
import MediaModule from './components/MediaModule';
import * as dbService from './services/dbService';

const DEFAULT_CATEGORIES = ['Salary', 'Food', 'Groceries', 'Rent', 'Investments', 'Entertainment', 'Utilities', 'Transfer', 'Shopping', 'Travel'];

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<OmniModule>(OmniModule.COMMAND_CENTER);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [dbReady, setDbReady] = useState(false);
  const [aiActive, setAiActive] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [health, setHealth] = useState<HealthMetric[]>([]);
  const [workflows, setWorkflows] = useState<WorkflowRule[]>([]);
  const [unifiedFeed, setUnifiedFeed] = useState<any[]>([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  useEffect(() => {
    dbService.onLog(msg => setLogs(prev => [msg, ...prev].slice(0, 50)));
    
    const loadDB = async () => {
      await dbService.initDB();
      // Safe check for process.env which is injected by env.js
      const envKey = (window as any).process?.env?.API_KEY;
      let keyDetected = !!envKey;
      
      try {
        const healthRes = await fetch('/api/health').then(r => r.json());
        keyDetected = healthRes.ai.active;
      } catch (e) {}
      
      setAiActive(keyDetected);
      refreshData();
      setDbReady(true);
    };
    loadDB();
  }, []);

  useEffect(() => {
    if (searchTerm.length > 1) {
      setSearchResults(dbService.universalSearch(searchTerm));
    } else {
      setSearchResults([]);
    }
  }, [searchTerm]);

  const refreshData = () => {
    setPosts(dbService.getPosts());
    setTransactions(dbService.getTransactions());
    setBalances(dbService.getBalances());
    setTasks(dbService.getTasks());
    setNotes(dbService.getNotes());
    setContacts(dbService.getContacts());
    setAssets(dbService.getAssets());
    setHealth(dbService.getHealthMetrics());
    setWorkflows(dbService.getWorkflowRules());
    setUnifiedFeed(dbService.getUnifiedFeed());
  };

  const renderModule = () => {
    switch (activeModule) {
      case OmniModule.COMMAND_CENTER: return <CommandCenter feed={unifiedFeed} stats={{posts, transactions, balances, tasks, notes, contacts, assets, health, workflows}} onNavigate={setActiveModule} />;
      case OmniModule.COMMS: return <CommsModule />;
      case OmniModule.CREDENTIALS: return <IdentityModule />;
      case OmniModule.MEDIA: return <MediaModule />;
      case OmniModule.SOCIAL: return <SocialModule posts={posts} onAddPost={(t) => { dbService.addPost({id:Date.now().toString(), author:'me.pds', text:t, likes:0, createdAt:new Date().toISOString()}); refreshData(); }} />;
      case OmniModule.FINANCE: return <FinanceModule transactions={transactions} onAdd={(t) => { dbService.addTransaction({...t, id:Date.now().toString()}); refreshData(); }} categories={categories} onAddCategory={(c) => setCategories([...categories, c])} />;
      case OmniModule.WALLET: return <WalletModule balances={balances} transactions={transactions} onTransaction={(t) => { dbService.addTransaction({...t, id:Date.now().toString()}); refreshData(); }} categories={categories} onAddCategory={(c) => setCategories([...categories, c])} />;
      case OmniModule.PROJECTS: return <ProjectModule tasks={tasks} onAdd={(title, priority) => { dbService.addTask({id:Date.now().toString(), title, status:'todo', priority}); refreshData(); }} onToggle={(id) => { const t = tasks.find(x => x.id === id); if(t) dbService.updateTaskStatus(id, t.status === 'done' ? 'todo' : 'done'); refreshData(); }} />;
      case OmniModule.VAULT: return <VaultModule notes={notes} onAdd={(t, c, tg) => { dbService.addNote({id:Date.now().toString(), title:t, content:c, tags:tg, updatedAt:new Date().toISOString()}); refreshData(); }} />;
      case OmniModule.PULSE: return <PulseModule contacts={contacts} onAdd={(c) => { dbService.addContact({...c, id:Date.now().toString()}); refreshData(); }} />;
      case OmniModule.INVENTORY: return <InventoryModule assets={assets} onAdd={(a) => { dbService.addAsset({...a, id:Date.now().toString()}); refreshData(); }} />;
      case OmniModule.HEALTH: return <HealthModule health={health} onAdd={(m) => { dbService.addHealthMetric({...m, id:Date.now().toString()}); refreshData(); }} />;
      case OmniModule.WORKFLOWS: return <WorkflowModule workflows={workflows} />;
      case OmniModule.INSIGHTS: return <InsightsModule data={{posts, transactions, balances, tasks, notes, contacts, assets, health, workflows}} />;
      case OmniModule.SYSTEM_LEDGER: return <SystemLedgerModule aiActive={aiActive} />;
      default: return <CommandCenter feed={unifiedFeed} stats={{posts, transactions, balances, tasks, notes, contacts, assets, health, workflows}} onNavigate={setActiveModule} />;
    }
  };

  if (!dbReady) return (
    <div className="h-screen bg-[#02040a] flex flex-col items-center justify-center">
      <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center animate-spin mb-4 shadow-2xl shadow-blue-500/50">
        <Database className="text-white" size={32} />
      </div>
      <p className="font-black text-blue-500 uppercase tracking-[0.4em] animate-pulse">Mounting Sovereign Core</p>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#02040a] overflow-hidden text-gray-100 font-sans selection:bg-blue-600 selection:text-white">
      <nav className="w-20 md:w-72 border-r border-gray-900 bg-[#080b12] flex flex-col py-6">
        <div className="px-6 mb-10 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-900/20"><Radio className="text-white" size={28} /></div>
          <div className="hidden md:block">
            <h1 className="text-xl font-black tracking-tight leading-none text-white">OMNIPDS</h1>
            <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest mt-1">Sovereign Node v2.2</p>
          </div>
        </div>
        
        <div className="flex-1 space-y-1 px-4 overflow-y-auto custom-scrollbar">
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4 px-2">Sovereign OS</div>
          <SidebarItem icon={<LayoutDashboard />} label="Command Center" active={activeModule === OmniModule.COMMAND_CENTER} onClick={() => setActiveModule(OmniModule.COMMAND_CENTER)} />
          <SidebarItem icon={<MessageSquare />} label="Comms Hub" active={activeModule === OmniModule.COMMS} onClick={() => setActiveModule(OmniModule.COMMS)} />
          <SidebarItem icon={<Fingerprint />} label="Identity" active={activeModule === OmniModule.CREDENTIALS} onClick={() => setActiveModule(OmniModule.CREDENTIALS)} />
          <SidebarItem icon={<Activity />} label="Bio-Matrix" active={activeModule === OmniModule.HEALTH} onClick={() => setActiveModule(OmniModule.HEALTH)} />
          <SidebarItem icon={<Sparkles />} label="Strategic AI" active={activeModule === OmniModule.INSIGHTS} onClick={() => setActiveModule(OmniModule.INSIGHTS)} />
          
          <div className="h-4"></div>
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4 px-2">Records</div>
          <SidebarItem icon={<CreditCard />} label="E-Wallet" active={activeModule === OmniModule.WALLET} onClick={() => setActiveModule(OmniModule.WALLET)} />
          <SidebarItem icon={<WalletIcon />} label="Ledger" active={activeModule === OmniModule.FINANCE} onClick={() => setActiveModule(OmniModule.FINANCE)} />
          <SidebarItem icon={<Briefcase />} label="Mission" active={activeModule === OmniModule.PROJECTS} onClick={() => setActiveModule(OmniModule.PROJECTS)} />
          <SidebarItem icon={<BookOpen />} label="Vault" active={activeModule === OmniModule.VAULT} onClick={() => setActiveModule(OmniModule.VAULT)} />
          
          <div className="h-4"></div>
          <div className="text-[10px] font-bold text-gray-600 uppercase tracking-[0.2em] mb-4 px-2">Infrastructure</div>
          <SidebarItem icon={<Users />} label="Social" active={activeModule === OmniModule.SOCIAL} onClick={() => setActiveModule(OmniModule.SOCIAL)} />
          <SidebarItem icon={<Box />} label="Inventory" active={activeModule === OmniModule.INVENTORY} onClick={() => setActiveModule(OmniModule.INVENTORY)} />
          <SidebarItem icon={<Image />} label="Media" active={activeModule === OmniModule.MEDIA} onClick={() => setActiveModule(OmniModule.MEDIA)} />
          <SidebarItem icon={<Workflow />} label="Automations" active={activeModule === OmniModule.WORKFLOWS} onClick={() => setActiveModule(OmniModule.WORKFLOWS)} />
          <SidebarItem icon={<Terminal />} label="Terminal" active={activeModule === OmniModule.SYSTEM_LEDGER} onClick={() => setActiveModule(OmniModule.SYSTEM_LEDGER)} />
        </div>
      </nav>

      <main className="flex-1 flex flex-col overflow-hidden bg-[#02040a]">
        <header className="h-20 border-b border-gray-900 bg-[#02040a]/80 backdrop-blur-2xl px-8 flex items-center justify-between z-30">
          <div className="flex items-center gap-8 flex-1 max-w-2xl">
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-blue-400 transition-colors" size={18} />
              <input 
                type="text" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Universal Search (FTS5 Active)"
                className="w-full bg-[#080b12] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600/30 focus:border-blue-500/50 transition-all text-sm font-medium"
              />
              {searchResults.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-4 bg-[#080b12] border border-gray-800 rounded-3xl shadow-2xl overflow-hidden z-50">
                  <div className="p-3 border-b border-gray-800 bg-gray-950/50 text-[10px] font-black uppercase tracking-widest text-gray-600">Cross-Module Search Results</div>
                  {searchResults.map((res, i) => (
                    <button key={i} onClick={() => { setActiveModule(res._type as OmniModule); setSearchTerm(''); }} className="w-full flex items-center gap-4 px-5 py-4 hover:bg-blue-600/10 border-b border-gray-800/50 last:border-0 transition-all">
                       <div className="p-2.5 bg-gray-900 rounded-xl text-blue-400"><Database size={16}/></div>
                       <div className="text-left">
                          <p className="font-bold text-sm text-gray-100">{res.title || res.text || res.description}</p>
                          <span className="text-[10px] font-black text-gray-600 uppercase tracking-tighter">{res._type}</span>
                       </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-right hidden sm:block">
               <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none">Status</p>
               <p className="text-xs font-bold text-blue-400">Node: Local/8087</p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 border border-gray-800 shadow-xl overflow-hidden">
               <img src="https://picsum.photos/seed/pds/100/100" alt="Avatar" className="w-full h-full object-cover opacity-80" />
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto custom-scrollbar">
          <div className="p-10 max-w-[1600px] mx-auto pb-32">{renderModule()}</div>
        </div>

        <footer className="h-10 border-t border-gray-900 bg-[#080b12] flex items-center px-6 gap-6 z-40">
           <div className="flex items-center gap-2">
              <span className={`w-2 h-2 rounded-full ${aiActive ? 'bg-blue-500 animate-pulse' : 'bg-gray-700'}`}></span>
              <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Sovereign Core</span>
           </div>
           <div className="h-4 w-px bg-gray-800"></div>
           <div className="flex-1 overflow-hidden whitespace-nowrap">
              <p className="text-[10px] font-mono text-blue-400/70">{logs[0] || 'System Ready. Waiting for interactions...'}</p>
           </div>
           <div className="h-4 w-px bg-gray-800"></div>
           <div className="flex items-center gap-4 text-[10px] font-bold text-gray-600 uppercase">
              <span>DB Size: {dbService.getDBSize()}</span>
              <span>Uptime: {Math.floor(performance.now() / 1000)}s</span>
           </div>
        </footer>
      </main>
    </div>
  );
};

export default App;
