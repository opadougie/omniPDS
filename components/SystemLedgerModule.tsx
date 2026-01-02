
import React, { useState, useEffect } from 'react';
import { Terminal, Database, Play, Save, Trash2, AlertCircle, FileJson, Table as TableIcon, Zap, ExternalLink, Info, Cpu, HardDrive, Activity } from 'lucide-react';
import * as dbService from '../services/dbService';

interface SystemLedgerModuleProps {
  aiActive?: boolean;
}

const SystemLedgerModule: React.FC<SystemLedgerModuleProps> = ({ aiActive }) => {
  const [query, setQuery] = useState('SELECT * FROM posts LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState({ size: '0 KB', posts: 0, txs: 0, tasks: 0 });
  const [hwStats, setHwStats] = useState<any>(null);

  const refreshStats = async () => {
    setDbStats({
      size: dbService.getDBSize(),
      posts: dbService.getTableRowCount('posts'),
      txs: dbService.getTableRowCount('transactions'),
      tasks: dbService.getTableRowCount('tasks')
    });
    try {
      const res = await fetch('/api/health');
      if (res.ok) {
        const data = await res.json();
        setHwStats(data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    refreshStats();
    const interval = setInterval(refreshStats, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleRunSQL = () => {
    setError(null);
    const result = dbService.executeRawSQL(query);
    if (result.success) {
      setResults(result.data || []);
      refreshStats();
    } else {
      setError(result.error || "Unknown SQL Error");
    }
  };

  const downloadBackup = () => {
    const data = localStorage.getItem('omnipds_sqlite');
    if (!data) return;
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnipds_backup_${new Date().toISOString()}.json`;
    a.click();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Infrastructure Hub */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800 relative overflow-hidden group">
           <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 bg-blue-600/10 text-blue-400 rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all"><Cpu size={24}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Compute Engine</p>
                <h4 className="text-xl font-black">{hwStats?.system?.cpus || '0'} Cores @ {hwStats?.system?.load?.[0]?.toFixed(2) || '0.00'}</h4>
              </div>
           </div>
           <div className="mt-4 h-1 w-full bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-blue-500 animate-pulse" style={{width: `${(hwStats?.system?.load?.[0] / (hwStats?.system?.cpus || 1)) * 100}%`}}></div>
           </div>
        </div>
        <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800 relative overflow-hidden group">
           <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 bg-purple-600/10 text-purple-400 rounded-2xl group-hover:bg-purple-600 group-hover:text-white transition-all"><Activity size={24}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Memory Matrix</p>
                <h4 className="text-xl font-black">{hwStats ? (hwStats.system.freeMem / 1024 / 1024 / 1024).toFixed(1) : '0'} GB Free</h4>
              </div>
           </div>
           <div className="mt-4 h-1 w-full bg-gray-900 rounded-full overflow-hidden">
              <div className="h-full bg-purple-500" style={{width: `${hwStats ? (1 - hwStats.system.freeMem / hwStats.system.totalMem) * 100 : 0}%`}}></div>
           </div>
        </div>
        <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800 relative overflow-hidden group">
           <div className="relative z-10 flex items-center gap-4">
              <div className="p-3 bg-green-600/10 text-green-400 rounded-2xl group-hover:bg-green-600 group-hover:text-white transition-all"><HardDrive size={24}/></div>
              <div>
                <p className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Sovereign Ledger</p>
                <h4 className="text-xl font-black">{dbStats.size} Committed</h4>
              </div>
           </div>
           <div className="mt-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <p className="text-[10px] font-bold text-gray-600">SQLite Read/Write Active</p>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* SQL Terminal */}
        <div className="lg:col-span-8 space-y-4">
          <div className="bg-[#0b0f1a] border border-gray-800 rounded-3xl overflow-hidden shadow-2xl">
            <div className="px-6 py-4 border-b border-gray-800 flex items-center justify-between bg-gray-950/50">
              <div className="flex items-center gap-2">
                <Terminal size={18} className="text-blue-400" />
                <h3 className="font-bold text-sm">Protocol Inspector</h3>
              </div>
              <div className="flex items-center gap-2">
                 <button onClick={downloadBackup} className="p-2 text-gray-400 hover:text-white transition-colors" title="Export DB">
                    <Save size={16} />
                 </button>
                 <button 
                  onClick={handleRunSQL}
                  className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all"
                 >
                  Execute <Play size={12} fill="currentColor" />
                 </button>
              </div>
            </div>
            <div className="p-0">
              <textarea 
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="w-full h-56 bg-gray-950 text-blue-300 p-6 font-mono text-sm focus:outline-none resize-none border-none"
                spellCheck={false}
              />
            </div>
          </div>

          {error && (
            <div className="p-4 bg-rose-900/20 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-rose-300 text-sm">
              <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
              <p className="font-mono">{error}</p>
            </div>
          )}

          <div className="max-h-[600px] overflow-y-auto custom-scrollbar rounded-3xl border border-gray-800 bg-[#0b0f1a]">
            {results.length > 0 ? results.map((result, rIdx) => (
              <div key={rIdx} className="overflow-x-auto">
                <table className="w-full text-left text-[11px]">
                  <thead>
                    <tr className="bg-gray-950/80 border-b border-gray-800 sticky top-0 z-10">
                      {result.columns.map((col: string, cIdx: number) => (
                        <th key={cIdx} className="px-4 py-3 font-black uppercase tracking-widest text-gray-500">{col}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {result.values.map((row: any[], rowIdx: number) => (
                      <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                        {row.map((cell: any, cellIdx: number) => (
                          <td key={cellIdx} className="px-4 py-3 font-mono text-gray-300 truncate max-w-[200px]">
                            {cell === null ? <span className="text-gray-700 italic">null</span> : String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )) : !error && (
              <div className="py-20 flex flex-col items-center justify-center text-gray-600">
                  <FileJson size={48} className="mb-4 opacity-10" />
                  <p className="text-sm font-bold uppercase tracking-widest opacity-40">Ready for query input...</p>
              </div>
            )}
          </div>
        </div>

        {/* Diagnostics & Schema Explorer */}
        <div className="lg:col-span-4 space-y-6">
          <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-tighter">
              <Zap size={16} className="text-amber-400" /> Infrastructure Node
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">API Gateway</span>
                <span className={`font-bold px-2 py-0.5 rounded ${aiActive ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {aiActive ? 'ONLINE' : 'BYPASS'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">OS Platform</span>
                <span className="text-blue-400 font-mono">{hwStats?.system?.platform || '...'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">Node Cluster</span>
                <span className="text-gray-400">{hwStats?.process?.node || '...'}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500">System Uptime</span>
                <span className="text-gray-400 font-mono">{hwStats ? Math.floor(hwStats.system.uptime / 3600) : 0} Hours</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2 uppercase tracking-tighter">
              <TableIcon size={16} className="text-blue-400" /> Schema Manifest
            </h4>
            <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar pr-2">
              {[
                { name: 'posts', fields: ['id', 'author', 'text', 'likes'] },
                { name: 'transactions', fields: ['id', 'amount', 'currency', 'type'] },
                { name: 'notes', fields: ['id', 'title', 'content', 'tags'] },
                { name: 'contacts', fields: ['id', 'name', 'handle', 'category'] },
                { name: 'assets', fields: ['id', 'name', 'serial', 'value', 'category'] },
              ].map((table, i) => (
                <div key={i} className="group">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-blue-400 font-mono text-sm font-bold uppercase">{table.name}</span>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Base</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                    {table.fields.map((f, fi) => (
                      <span key={fi} className="text-[9px] bg-gray-950 text-gray-500 px-2 py-0.5 rounded border border-gray-800 font-mono">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button 
            onClick={() => {
              if(confirm("Factory reset this PDS? This wipes all SQLite records.")) {
                localStorage.removeItem('omnipds_sqlite');
                window.location.reload();
              }
            }}
            className="w-full flex items-center justify-center gap-2 py-4 border border-rose-900/50 text-rose-500 hover:bg-rose-500/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
          >
            <Trash2 size={14} /> Wipe Sovereign Ledger
          </button>
        </div>
      </div>
    </div>
  );
};

export default SystemLedgerModule;
