
import React from 'react';
import { SocialPost, Transaction, ProjectTask } from '../types';
import { Activity, ShieldCheck, Database, Globe, CreditCard, Radio, Zap, ExternalLink, Fingerprint } from 'lucide-react';

interface DashboardModuleProps {
  posts: SocialPost[];
  transactions: Transaction[];
  tasks: ProjectTask[];
}

const DashboardModule: React.FC<DashboardModuleProps> = ({ posts, transactions, tasks }) => {
  const stats = [
    { label: 'Wallet Balance (Eq.)', value: '$12,760.75', icon: <CreditCard />, color: 'text-blue-400' },
    { label: 'Data Integrity', value: '99.9%', icon: <ShieldCheck />, color: 'text-green-400' },
    { label: 'Storage Used', value: '2.4 GB', icon: <Database />, color: 'text-purple-400' },
    { label: 'Network Uptime', value: '18d 4h', icon: <Activity />, color: 'text-orange-400' },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800 hover:border-gray-700 transition-colors shadow-sm">
            <div className={`mb-4 ${stat.color}`}>{React.cloneElement(stat.icon as React.ReactElement<{ size?: number }>, { size: 24 })}</div>
            <p className="text-gray-400 text-sm font-medium">{stat.label}</p>
            <h4 className="text-2xl font-bold mt-1 tracking-tight">{stat.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 p-8 bg-[#0b0f1a] rounded-3xl border border-gray-800">
          <div className="flex justify-between items-center mb-6">
            <h4 className="text-xl font-bold">Recent Federated Records</h4>
            <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-gray-950 px-3 py-1 rounded-full border border-gray-800 flex items-center gap-2">
              <Zap size={10} className="text-blue-400" /> Live Firehose
            </span>
          </div>
          <div className="space-y-4">
            {posts.length === 0 && transactions.length === 0 && tasks.length === 0 ? (
                <div className="p-8 text-center text-gray-600 italic border border-dashed border-gray-800 rounded-2xl">
                    No records found in local SQLite ledger.
                </div>
            ) : (
                [...posts.slice(0, 1), ...transactions.slice(0, 1), ...tasks.slice(0, 2)].map((item: any, i) => (
                <div key={i} className="flex items-center gap-4 p-4 bg-gray-950/50 rounded-2xl border border-gray-800 hover:bg-gray-900/40 transition-all group">
                    <div className={`w-2 h-2 rounded-full ${
                    'text' in item ? 'bg-blue-500' : 'amount' in item ? 'bg-green-500' : 'bg-orange-500'
                    }`}></div>
                    <div className="flex-1">
                    <p className="text-sm font-medium truncate">
                        {'text' in item ? item.text : 'amount' in item ? `Financial: ${item.description}` : item.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
                        {'text' in item ? 'Social Repository' : 'amount' in item ? 'Transaction Ledger' : 'Project Registry'}
                        </p>
                        <span className="text-gray-800 text-[10px]">•</span>
                        <span className="text-[10px] text-blue-500/70 font-mono">cid:{item.id.slice(0, 12)}...</span>
                    </div>
                    </div>
                    <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <ExternalLink size={14} className="text-gray-600 hover:text-blue-400 cursor-pointer" />
                    </div>
                </div>
                ))
            )}
          </div>
        </div>

        <div className="lg:col-span-5 space-y-6">
          <div className="p-8 bg-gradient-to-br from-indigo-900/40 to-blue-900/40 rounded-3xl border border-blue-800/30 relative overflow-hidden group">
            <div className="relative z-10">
              <h4 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Globe className="text-blue-400" /> Protocol Bridge
              </h4>
              <p className="text-gray-300 text-sm leading-relaxed mb-6">
                Your PDS is successfully synchronizing with the global ATProto relay. Your DID is resolvable by Bluesky and other federated clients.
              </p>
              <div className="space-y-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">PLC Directory Status</span>
                  <span className="text-green-400 font-bold uppercase text-[10px] flex items-center gap-1">
                    <Radio size={12} className="text-green-400" /> Resolvable
                  </span>
                </div>
                <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                  <div className="bg-blue-500 h-full w-[98%]"></div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-400">Handle: <span className="text-blue-400">me.pds</span></span>
                  <span className="text-blue-400 font-bold uppercase text-[10px]">Verified</span>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all"></div>
          </div>

          <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800 flex items-center justify-between group cursor-pointer hover:border-gray-700 transition-all">
            <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-900 rounded-2xl text-orange-400 group-hover:scale-105 transition-transform">
                    <Fingerprint size={20} />
                </div>
                <div>
                    <h5 className="font-bold text-sm">Rotate Keys</h5>
                    <p className="text-[10px] text-gray-500 uppercase font-black tracking-widest">Security Protocol</p>
                </div>
            </div>
            <span className="text-xs text-gray-600">v2.1</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardModule;
