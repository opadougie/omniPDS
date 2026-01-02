
import React, { useState, useEffect } from 'react';
import { Terminal, Database, Play, Save, Trash2, AlertCircle, FileJson, Table as TableIcon, Zap, ExternalLink, Info } from 'lucide-react';
import * as dbService from '../services/dbService';

interface SystemLedgerModuleProps {
  aiActive?: boolean;
}

const SystemLedgerModule: React.FC<SystemLedgerModuleProps> = ({ aiActive }) => {
  const [query, setQuery] = useState('SELECT * FROM posts LIMIT 10;');
  const [results, setResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dbStats, setDbStats] = useState({ size: '0 KB', posts: 0, txs: 0, tasks: 0 });

  const refreshStats = () => {
    setDbStats({
      size: dbService.getDBSize(),
      posts: dbService.getTableRowCount('posts'),
      txs: dbService.getTableRowCount('transactions'),
      tasks: dbService.getTableRowCount('tasks')
    });
  };

  useEffect(() => {
    refreshStats();
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
      {/* DB Health Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-5 bg-[#0b0f1a] rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl">
            <Database size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Store Size</p>
            <h4 className="font-bold text-lg">{dbStats.size}</h4>
          </div>
        </div>
        <div className="p-5 bg-[#0b0f1a] rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-green-600/10 text-green-400 rounded-xl">
            <TableIcon size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Posts</p>
            <h4 className="font-bold text-lg">{dbStats.posts} Rows</h4>
          </div>
        </div>
        <div className="p-5 bg-[#0b0f1a] rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-purple-600/10 text-purple-400 rounded-xl">
            <TableIcon size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Ledger</p>
            <h4 className="font-bold text-lg">{dbStats.txs} Rows</h4>
          </div>
        </div>
        <div className="p-5 bg-[#0b0f1a] rounded-2xl border border-gray-800 flex items-center gap-4">
          <div className="p-3 bg-orange-600/10 text-orange-400 rounded-xl">
            <TableIcon size={20} />
          </div>
          <div>
            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Registry</p>
            <h4 className="font-bold text-lg">{dbStats.tasks} Rows</h4>
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
                <h3 className="font-bold text-sm">Universal SQL Console</h3>
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
                className="w-full h-48 bg-gray-950 text-blue-300 p-6 font-mono text-sm focus:outline-none resize-none"
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

          {results.length > 0 && results.map((result, rIdx) => (
            <div key={rIdx} className="bg-[#0b0f1a] border border-gray-800 rounded-2xl overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-gray-950/80 border-b border-gray-800">
                    {result.columns.map((col: string, cIdx: number) => (
                      <th key={cIdx} className="px-4 py-3 font-black uppercase tracking-widest text-gray-500">{col}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-800/50">
                  {result.values.map((row: any[], rowIdx: number) => (
                    <tr key={rowIdx} className="hover:bg-white/5 transition-colors">
                      {row.map((cell: any, cellIdx: number) => (
                        <td key={cellIdx} className="px-4 py-3 font-mono text-gray-300">
                          {cell === null ? <span className="text-gray-700 italic">null</span> : String(cell)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {results.length === 0 && !error && (
             <div className="py-20 flex flex-col items-center justify-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-600">
                <FileJson size={48} className="mb-4 opacity-20" />
                <p className="text-sm">Run a query to inspect the Merkle search tree data.</p>
             </div>
          )}
        </div>

        {/* Diagnostics & Schema Explorer */}
        <div className="lg:col-span-4 space-y-6">
          {/* AI Diagnostic Panel */}
          <div className="p-6 bg-gradient-to-br from-[#0b0f1a] to-gray-900 rounded-3xl border border-gray-800">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <Zap size={16} className="text-amber-400" /> AI Environment Diagnostic
            </h4>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">API Key Status</span>
                <span className={`font-bold px-2 py-0.5 rounded ${aiActive ? 'bg-green-500/20 text-green-400' : 'bg-rose-500/20 text-rose-400'}`}>
                  {aiActive ? 'RESOLVED' : 'MISSING'}
                </span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 font-medium">Engine Path</span>
                <span className="text-blue-400 font-mono">/opt/omnipds/.env.local</span>
              </div>
              {!aiActive && (
                <div className="mt-4 p-4 bg-amber-900/10 border border-amber-500/20 rounded-xl space-y-2">
                  <div className="flex items-center gap-2 text-amber-400 text-[10px] font-bold uppercase tracking-wider">
                    <Info size={12} /> Key Recovery Guide
                  </div>
                  <p className="text-[11px] text-gray-400 leading-relaxed">
                    If you already have a key, check your <strong>Google AI Studio</strong> dashboard under "My API Keys".
                  </p>
                  <a 
                    href="https://aistudio.google.com/app/apikey" 
                    target="_blank" 
                    rel="noreferrer"
                    className="flex items-center gap-2 text-blue-400 hover:text-blue-300 text-xs font-bold pt-1"
                  >
                    Open AI Studio <ExternalLink size={12} />
                  </a>
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800">
            <h4 className="font-bold text-sm mb-4 flex items-center gap-2">
              <TableIcon size={16} className="text-blue-400" /> Protocol Schema
            </h4>
            <div className="space-y-4">
              {[
                { name: 'posts', fields: ['id (UUID)', 'author (DID)', 'text (STR)', 'likes (INT)', 'createdAt (ISO)'] },
                { name: 'transactions', fields: ['id', 'amount', 'currency', 'category', 'type', 'date', 'description'] },
                { name: 'tasks', fields: ['id', 'title', 'status', 'priority'] },
                { name: 'balances', fields: ['currency (PK)', 'amount', 'label', 'symbol'] },
              ].map((table, i) => (
                <div key={i} className="group cursor-help">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-blue-400 font-mono text-sm font-bold">{table.name}</span>
                    <span className="text-[10px] text-gray-600 font-bold uppercase">Table</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {table.fields.map((f, fi) => (
                      <span key={fi} className="text-[9px] bg-gray-900 text-gray-500 px-2 py-0.5 rounded border border-gray-800">{f}</span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="p-6 bg-gradient-to-br from-gray-900 to-gray-950 rounded-3xl border border-gray-800">
            <h4 className="font-bold text-sm mb-2 flex items-center gap-2 text-orange-400">
              <AlertCircle size={16} /> Danger Zone
            </h4>
            <p className="text-[10px] text-gray-500 mb-4 leading-relaxed uppercase tracking-tighter">
              Irreversible destructive operations against the local SQLite state.
            </p>
            <button 
              onClick={() => {
                if(confirm("Factory reset this PDS? This wipes all SQLite records.")) {
                  localStorage.removeItem('omnipds_sqlite');
                  window.location.reload();
                }
              }}
              className="w-full flex items-center justify-center gap-2 py-3 border border-rose-900/50 text-rose-500 hover:bg-rose-500/10 rounded-xl text-xs font-bold transition-all"
            >
              <Trash2 size={14} /> Wipe Local Storage
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemLedgerModule;
