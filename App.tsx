
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, Users, Wallet as WalletIcon, Briefcase, Sparkles, Settings, 
  CreditCard, Globe, Copy, Check, Database, Terminal, Zap, ZapOff, BookOpen, UserPlus, Box 
} from 'lucide-react';
import { OmniModule, SocialPost, Transaction, ProjectTask, WalletBalance, Note, Contact, Asset } from './types';
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
import * as dbService from './services/dbService';

const DEFAULT_CATEGORIES = ['Salary', 'Food', 'Groceries', 'Rent', 'Investments', 'Entertainment', 'Utilities', 'Transfer', 'Shopping', 'Travel'];

const App: React.FC = () => {
  const [activeModule, setActiveModule] = useState<OmniModule>(OmniModule.IDENTITY);
  const [categories, setCategories] = useState<string[]>(DEFAULT_CATEGORIES);
  const [copied, setCopied] = useState(false);
  const [dbReady, setDbReady] = useState(false);
  const [aiActive, setAiActive] = useState(false);
  
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balances, setBalances] = useState<WalletBalance[]>([]);
  const [tasks, setTasks] = useState<ProjectTask[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);

  const pdsData = useMemo(() => ({
    posts, transactions, balances, tasks, notes, contacts, assets
  }), [posts, transactions, balances, tasks, notes, contacts, assets]);

  useEffect(() => {
    let mounted = true;
    const loadDB = async () => {
      await dbService.initDB();
      let keyDetected = !!process.env.API_KEY;
      if (!keyDetected) {
        try {
          const health = await fetch('/api/health').then(r => r.json());
          keyDetected = health.ai_active;
        } catch (e) {}
      }
      if (mounted) {
        setAiActive(keyDetected);
        refreshData();
        setDbReady(true);
      }
    };
    loadDB();
    return () => { mounted = false; };
  }, []);

  const refreshData = () => {
    setPosts(dbService.getPosts());
    setTransactions(dbService.getTransactions());
    setBalances(dbService.getBalances());
    setTasks(dbService.getTasks());
    setNotes(dbService.getNotes());
    setContacts(dbService.getContacts());
    setAssets(dbService.getAssets());
  };

  const addPost = (text: string) => {
    dbService.addPost({ id: Date.now().toString(), author: 'me.pds', text, likes: 0, createdAt: new Date().toISOString() });
    refreshData();
  };

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    dbService.addTransaction({ ...t, id: Date.now().toString() });
    refreshData();
  };

  const handleAddTask = (title: string, priority: ProjectTask['priority'] = 'medium') => {
    dbService.addTask({ id: Date.now().toString(), title, status: 'todo', priority });
    refreshData();
  };

  const handleAddNote = (title: string, content: string, tags: string) => {
    dbService.addNote({ id: Date.now().toString(), title, content, tags, updatedAt: new Date().toISOString() });
    refreshData();
  };

  const handleAddContact = (contact: Omit<Contact, 'id'>) => {
    dbService.addContact({ ...contact, id: Date.now().toString() });
    refreshData();
  };

  const handleAddAsset = (asset: Omit<Asset, 'id'>) => {
    dbService.addAsset({ ...asset, id: Date.now().toString() });
    refreshData();
  };

  const renderModule = () => {
    switch (activeModule) {
      case OmniModule.SOCIAL: return <SocialModule posts={posts} onAddPost={addPost} />;
      case OmniModule.FINANCE: return <FinanceModule transactions={transactions} onAdd={handleAddTransaction} categories={categories} onAddCategory={(c) => setCategories([...categories, c])} />;
      case OmniModule.WALLET: return <WalletModule balances={balances} transactions={transactions} onTransaction={handleAddTransaction} categories={categories} onAddCategory={(c) => setCategories([...categories, c])} />;
      case OmniModule.PROJECTS: return <ProjectModule tasks={tasks} onAdd={handleAddTask} onToggle={(id) => { const t = tasks.find(x => x.id === id); if(t) dbService.updateTaskStatus(id, t.status === 'done' ? 'todo' : 'done'); refreshData(); }} />;
      case OmniModule.VAULT: return <VaultModule notes={notes} onAdd={handleAddNote} />;
      case OmniModule.PULSE: return <PulseModule contacts={contacts} onAdd={handleAddContact} />;
      case OmniModule.INVENTORY: return <InventoryModule assets={assets} onAdd={handleAddAsset} />;
      case OmniModule.INSIGHTS: return <InsightsModule data={pdsData} />;
      case OmniModule.SYSTEM_LEDGER: return <SystemLedgerModule aiActive={aiActive} />;
      default: return <DashboardModule posts={posts} transactions={transactions} tasks={tasks} />;
    }
  };

  if (!dbReady) return <div className="h-screen bg-[#030712] flex items-center justify-center font-bold text-blue-500 animate-pulse uppercase tracking-widest">Booting OmniPDS Core...</div>;

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden text-gray-100">
      <nav className="w-20 md:w-64 border-r border-gray-800 bg-[#0b0f1a] flex flex-col py-6">
        <div className="px-6 mb-8 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg"><Sparkles className="text-white" size={24} /></div>
          <h1 className="hidden md:block text-xl font-bold">OmniPDS</h1>
        </div>
        <div className="flex-1 space-y-1 px-3 overflow-y-auto custom-scrollbar">
          <SidebarItem icon={<LayoutDashboard />} label="Dashboard" active={activeModule === OmniModule.IDENTITY} onClick={() => setActiveModule(OmniModule.IDENTITY)} />
          <SidebarItem icon={<Users />} label="Social Hub" active={activeModule === OmniModule.SOCIAL} onClick={() => setActiveModule(OmniModule.SOCIAL)} />
          <SidebarItem icon={<BookOpen />} label="Vault" active={activeModule === OmniModule.VAULT} onClick={() => setActiveModule(OmniModule.VAULT)} />
          <SidebarItem icon={<Box />} label="Assets" active={activeModule === OmniModule.INVENTORY} onClick={() => setActiveModule(OmniModule.INVENTORY)} />
          <SidebarItem icon={<UserPlus />} label="Pulse" active={activeModule === OmniModule.PULSE} onClick={() => setActiveModule(OmniModule.PULSE)} />
          <SidebarItem icon={<CreditCard />} label="E-Wallet" active={activeModule === OmniModule.WALLET} onClick={() => setActiveModule(OmniModule.WALLET)} />
          <SidebarItem icon={<WalletIcon />} label="Ledger" active={activeModule === OmniModule.FINANCE} onClick={() => setActiveModule(OmniModule.FINANCE)} />
          <SidebarItem icon={<Briefcase />} label="Mission" active={activeModule === OmniModule.PROJECTS} onClick={() => setActiveModule(OmniModule.PROJECTS)} />
          <SidebarItem icon={<Sparkles />} label="Insights" active={activeModule === OmniModule.INSIGHTS} onClick={() => setActiveModule(OmniModule.INSIGHTS)} />
          <SidebarItem icon={<Terminal />} label="Root" active={activeModule === OmniModule.SYSTEM_LEDGER} onClick={() => setActiveModule(OmniModule.SYSTEM_LEDGER)} />
        </div>
        <div className="px-4 mt-auto">
          <div className={`p-4 rounded-xl border ${aiActive ? 'border-amber-500/20 bg-amber-500/5' : 'border-gray-800 bg-gray-900'} hidden md:block`}>
            <p className={`text-[10px] font-black uppercase mb-1 ${aiActive ? 'text-amber-500' : 'text-gray-500'}`}>{aiActive ? 'Gemini Engine Prime' : 'Engine Offline'}</p>
            <div className={`h-1.5 w-full rounded-full bg-gray-800 overflow-hidden`}>
              <div className={`h-full ${aiActive ? 'bg-amber-400 w-full animate-pulse' : 'bg-gray-700 w-0'}`}></div>
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 overflow-y-auto bg-[#030712] custom-scrollbar">
        <header className="h-16 border-b border-gray-800 bg-[#030712]/80 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-20">
          <h2 className="font-bold text-lg capitalize tracking-tight">{activeModule.toLowerCase().replace('_', ' ')}</h2>
          <div className="flex items-center gap-4">
            <button onClick={() => { navigator.clipboard.writeText("did:plc:omni8927"); setCopied(true); setTimeout(()=>setCopied(false),2000); }} className="px-4 py-1.5 bg-gray-900 border border-gray-800 rounded-full text-[10px] flex items-center gap-2 hover:bg-gray-800 transition-all">
              <span className="text-gray-500">DID:</span><span className="text-blue-400 font-mono">omni8927</span>
              {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12} className="text-gray-600"/>}
            </button>
          </div>
        </header>
        <div className="p-8 max-w-7xl mx-auto">{renderModule()}</div>
      </main>
    </div>
  );
};
export default App;
