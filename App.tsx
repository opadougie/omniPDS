
import React, { useState, useEffect, useMemo } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  Wallet as WalletIcon, 
  Briefcase, 
  Sparkles, 
  Settings,
  CreditCard,
  Globe,
  Copy,
  Check,
  Database,
  Terminal,
  Zap,
  ZapOff
} from 'lucide-react';
import { OmniModule, SocialPost, Transaction, ProjectTask, WalletBalance } from './types';
import SidebarItem from './components/SidebarItem';
import SocialModule from './components/SocialModule';
import FinanceModule from './components/FinanceModule';
import ProjectModule from './components/ProjectModule';
import InsightsModule from './components/InsightsModule';
import DashboardModule from './components/DashboardModule';
import WalletModule from './components/WalletModule';
import SystemLedgerModule from './components/SystemLedgerModule';
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

  const pdsData = useMemo(() => ({
    posts,
    transactions,
    balances,
    tasks
  }), [posts, transactions, balances, tasks]);

  useEffect(() => {
    let mounted = true;
    const loadDB = async () => {
      await dbService.initDB();
      
      // Determine if AI is active by checking system environment or server health
      let keyDetected = !!process.env.API_KEY;
      
      if (!keyDetected) {
        try {
          const health = await fetch('/api/health').then(r => r.json());
          keyDetected = health.ai_active;
        } catch (e) {
          // Silent catch for local-only preview
        }
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
  };

  const addPost = (text: string) => {
    const post: SocialPost = {
      id: Date.now().toString(),
      author: 'me.pds',
      text,
      likes: 0,
      createdAt: new Date().toISOString()
    };
    dbService.addPost(post);
    refreshData();
  };

  const handleAddTransaction = (t: Omit<Transaction, 'id'>) => {
    const newTx: Transaction = { ...t, id: Date.now().toString() };
    dbService.addTransaction(newTx);
    refreshData();
  };

  const addCategory = (category: string) => {
    if (!categories.includes(category)) {
      setCategories([...categories, category]);
    }
  };

  const handleAddTask = (title: string, priority: ProjectTask['priority'] = 'medium') => {
    const task: ProjectTask = { id: Date.now().toString(), title, status: 'todo', priority };
    dbService.addTask(task);
    refreshData();
  };

  const toggleTask = (id: string) => {
    const task = tasks.find(t => t.id === id);
    if (task) {
      const newStatus = task.status === 'done' ? 'todo' : 'done';
      dbService.updateTaskStatus(id, newStatus);
      refreshData();
    }
  };

  const handleCopyDID = () => {
    navigator.clipboard.writeText("did:plc:omni8927xzk32k9");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!dbReady) {
    return (
      <div className="h-screen bg-[#030712] flex flex-col items-center justify-center transition-opacity duration-300">
        <Database className="text-blue-500 animate-pulse mb-4" size={48} />
        <h2 className="text-xl font-bold">Mounting SQLite Ledger...</h2>
        <p className="text-gray-500 text-sm mt-2">Initializing Universal Data Protocol</p>
      </div>
    );
  }

  const renderModule = () => {
    switch (activeModule) {
      case OmniModule.SOCIAL: return <SocialModule posts={posts} onAddPost={addPost} />;
      case OmniModule.FINANCE: return <FinanceModule transactions={transactions} onAdd={handleAddTransaction} categories={categories} onAddCategory={addCategory} />;
      case OmniModule.WALLET: return <WalletModule balances={balances} transactions={transactions} onTransaction={handleAddTransaction} categories={categories} onAddCategory={addCategory} />;
      case OmniModule.PROJECTS: return <ProjectModule tasks={tasks} onAdd={handleAddTask} onToggle={toggleTask} />;
      case OmniModule.INSIGHTS: return <InsightsModule data={pdsData} />;
      case OmniModule.SYSTEM_LEDGER: return <SystemLedgerModule aiActive={aiActive} />;
      case OmniModule.IDENTITY: return <DashboardModule posts={posts} transactions={transactions} tasks={tasks} />;
      default: return <DashboardModule posts={posts} transactions={transactions} tasks={tasks} />;
    }
  };

  return (
    <div className="flex h-screen bg-[#030712] overflow-hidden text-gray-100">
      <nav className="w-20 md:w-64 border-r border-gray-800 bg-[#0b0f1a] flex flex-col items-center md:items-stretch py-6">
        <div className="px-6 mb-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-900/20">
            <Sparkles className="text-white" size={24} />
          </div>
          <h1 className="hidden md:block text-xl font-bold tracking-tight">OmniPDS</h1>
        </div>

        <div className="flex-1 space-y-2 px-3 overflow-y-auto custom-scrollbar">
          <SidebarItem 
            icon={<LayoutDashboard />} 
            label="Overview" 
            active={activeModule === OmniModule.IDENTITY} 
            onClick={() => setActiveModule(OmniModule.IDENTITY)} 
          />
          <SidebarItem 
            icon={<Users />} 
            label="Social Network" 
            active={activeModule === OmniModule.SOCIAL} 
            onClick={() => setActiveModule(OmniModule.SOCIAL)} 
          />
          <SidebarItem 
            icon={<CreditCard />} 
            label="E-Wallet" 
            active={activeModule === OmniModule.WALLET} 
            onClick={() => setActiveModule(OmniModule.WALLET)} 
          />
          <SidebarItem 
            icon={<WalletIcon />} 
            label="Finance Hub" 
            active={activeModule === OmniModule.FINANCE} 
            onClick={() => setActiveModule(OmniModule.FINANCE)} 
          />
          <SidebarItem 
            icon={<Briefcase />} 
            label="Work/Projects" 
            active={activeModule === OmniModule.PROJECTS} 
            onClick={() => setActiveModule(OmniModule.PROJECTS)} 
          />
          <SidebarItem 
            icon={<Sparkles />} 
            label="AI Insights" 
            active={activeModule === OmniModule.INSIGHTS} 
            onClick={() => setActiveModule(OmniModule.INSIGHTS)} 
          />
          <SidebarItem 
            icon={<Terminal />} 
            label="System Ledger" 
            active={activeModule === OmniModule.SYSTEM_LEDGER} 
            onClick={() => setActiveModule(OmniModule.SYSTEM_LEDGER)} 
          />
        </div>

        <div className="px-3 pt-6 border-t border-gray-800">
          <div className="mt-4 p-4 rounded-xl bg-gradient-to-br from-gray-800 to-gray-900 hidden md:block border border-gray-700">
            <div className="flex items-center gap-2 mb-2">
              <Database className="text-blue-400" size={14} />
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">Ledger Status</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500"></div>
                <span className="text-xs font-medium text-gray-300">Disk Ready</span>
              </div>
            </div>
            
            <div className="flex items-center gap-2 mb-2">
              {aiActive ? <Zap className="text-amber-400" size={14} /> : <ZapOff className="text-gray-600" size={14} />}
              <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">AI Engine</span>
            </div>
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full ${aiActive ? 'bg-amber-400 animate-pulse' : 'bg-gray-700'}`}></div>
              <span className={`text-xs font-medium ${aiActive ? 'text-amber-400' : 'text-gray-500'}`}>
                {aiActive ? 'Gemini 3 Pro Active' : 'AI Offline'}
              </span>
            </div>
          </div>
        </div>
      </nav>

      <main className="flex-1 overflow-y-auto relative bg-[#030712] custom-scrollbar">
        <header className="sticky top-0 z-10 h-16 border-b border-gray-800 bg-[#030712]/80 backdrop-blur-md px-8 flex items-center justify-between">
          <h2 className="text-lg font-semibold capitalize">{activeModule.toLowerCase().replace('_', ' ')}</h2>
          <div className="flex items-center gap-4">
            <button 
              onClick={handleCopyDID}
              className="hidden sm:flex items-center gap-2 bg-gray-900 hover:bg-gray-800 rounded-full px-4 py-1.5 border border-gray-800 text-[11px] transition-all group"
            >
              <span className="text-gray-400">DID:</span>
              <span className="font-mono text-blue-400">did:plc:omni892...</span>
              {copied ? <Check size={12} className="text-green-500" /> : <Copy size={12} className="text-gray-600 group-hover:text-blue-400" />}
            </button>
            <img src="https://picsum.photos/seed/user123/40/40" className="w-10 h-10 rounded-full ring-2 ring-gray-800" alt="Avatar" />
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto">
          {renderModule()}
        </div>
      </main>
    </div>
  );
};

export default App;
