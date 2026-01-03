
import React from 'react';
import { OmniModule } from '../types';
import { 
  Activity, ShieldCheck, Database, Globe, CreditCard, 
  Zap, ExternalLink, Target, TrendingUp, Clock, AlertTriangle, Search,
  Briefcase, MessageSquare, Fingerprint, BookOpen, LayoutDashboard
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

interface CommandCenterProps {
  feed: any[];
  stats: any;
  onNavigate: (m: OmniModule) => void;
}

const CommandCenter: React.FC<CommandCenterProps> = ({ feed, stats, onNavigate }) => {
  const chartData = [
    { name: '01', activity: 40, health: 80, spend: 20 },
    { name: '02', activity: 30, health: 75, spend: 35 },
    { name: '03', activity: 60, health: 85, spend: 10 },
    { name: '04', activity: 50, health: 70, spend: 40 },
    { name: '05', activity: 80, health: 90, spend: 15 },
    { name: '06', activity: 55, health: 82, spend: 25 },
    { name: '07', activity: 70, health: 88, spend: 30 },
  ];

  const highlights = [
    { label: 'Wallet Equity', value: '$12,760.75', icon: <CreditCard />, color: 'text-blue-400', bg: 'bg-blue-400/5', border: 'border-blue-400/20' },
    { label: 'DB Index Muscle', value: 'FTS5 Active', icon: <Search />, color: 'text-green-400', bg: 'bg-green-400/5', border: 'border-green-400/20' },
    { label: 'Life Velocity', value: '8.4 ops', icon: <Activity />, color: 'text-purple-400', bg: 'bg-purple-400/5', border: 'border-purple-400/20' },
    { label: 'Node Uptime', value: '99.9%', icon: <Zap />, color: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/20' },
  ];

  const quickActions = [
    { label: 'Finance', icon: <CreditCard />, module: OmniModule.FINANCE, color: 'text-emerald-400' },
    { label: 'Mission', icon: <Briefcase />, module: OmniModule.PROJECTS, color: 'text-blue-400' },
    { label: 'Comms', icon: <MessageSquare />, module: OmniModule.COMMS, color: 'text-indigo-400' },
    { label: 'Vault', icon: <BookOpen />, module: OmniModule.VAULT, color: 'text-amber-400' },
    { label: 'Pulse', icon: <Activity />, module: OmniModule.PULSE, color: 'text-rose-400' },
    { label: 'Bio', icon: <Target />, module: OmniModule.HEALTH, color: 'text-cyan-400' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      {/* Sovereign Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {highlights.map((h, i) => (
          <div key={i} className={`p-6 rounded-3xl border ${h.bg} ${h.border} transition-transform hover:scale-[1.02] cursor-default shadow-sm group`}>
            <div className={`mb-4 ${h.color} group-hover:scale-110 transition-transform`}>{React.cloneElement(h.icon as React.ReactElement<{ size?: number }>, { size: 24 })}</div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{h.label}</p>
            <h4 className="text-3xl font-black mt-1 tracking-tight text-white">{h.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Main Visualizer */}
          <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-2xl relative overflow-hidden muscle-pulse">
             <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight text-white">Neural Load & Correlation</h3>
                  <p className="text-gray-500 text-sm">Synchronizing social reach, financial burn, and bio-matrix flux.</p>
                </div>
                <div className="hidden sm:flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Compute</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Integrity</span>
                  </div>
                </div>
             </div>
             <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorAct" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorHealth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} dy={10} />
                    <YAxis hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#02040a', border: '1px solid #1f2937', borderRadius: '16px' }}
                    />
                    <Area type="monotone" dataKey="activity" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorAct)" />
                    <Area type="monotone" dataKey="health" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorHealth)" />
                  </AreaChart>
                </ResponsiveContainer>
             </div>
          </div>

          {/* Quick Access Muscle Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
             {quickActions.map((action, i) => (
               <button 
                 key={i} 
                 onClick={() => onNavigate(action.module)}
                 className="flex flex-col items-center justify-center p-6 bg-[#080b12] border border-gray-900 rounded-[2rem] hover:bg-blue-600/10 hover:border-blue-500/30 transition-all group active:scale-95"
               >
                  <div className={`mb-3 ${action.color} group-hover:scale-110 transition-transform`}>
                    {React.cloneElement(action.icon as React.ReactElement<{ size?: number }>, { size: 28 })}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 group-hover:text-blue-400">{action.label}</span>
               </button>
             ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900">
               <h4 className="text-lg font-bold mb-6 flex items-center gap-3 text-white">
                  <Target className="text-blue-500" size={20} /> Mission Critical
               </h4>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-tighter">
                      <span className="text-gray-400">Database Saturation</span>
                      <span className="text-blue-400">92% Muscle</span>
                    </div>
                    <div className="h-2 w-full bg-gray-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{width: '92%'}}></div>
                    </div>
                  </div>
                  <button onClick={() => onNavigate(OmniModule.PROJECTS)} className="w-full py-4 bg-gray-900 hover:bg-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all text-gray-300">View Active Milestones</button>
               </div>
            </div>
            <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900">
               <h4 className="text-lg font-bold mb-6 flex items-center gap-3 text-white">
                  <TrendingUp className="text-indigo-400" size={20} /> Economic Flux
               </h4>
               <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(-5)}>
                      <Bar dataKey="spend" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 flex flex-col h-[820px] shadow-xl">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-xl font-black text-white">Life Firehose</h4>
                 <div className="px-3 py-1 bg-gray-950 border border-gray-800 rounded-full flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Live Sync</span>
              </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {feed.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 text-gray-600 italic">
                     <Clock size={32} className="mb-4 opacity-10" />
                     <p className="text-sm">Mounting ledger streams...</p>
                  </div>
                ) : (
                  feed.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-950/50 rounded-2xl border border-gray-900 hover:border-gray-800 transition-all group">
                       <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            item.type === 'SOCIAL' ? 'text-blue-400 bg-blue-400/10' : 
                            'text-green-400 bg-green-400/10'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-[9px] text-gray-600 font-mono">Verified</span>
                       </div>
                       <p className="text-sm font-bold text-gray-200 truncate">{item.title}</p>
                       <p className="text-[10px] text-gray-500 mt-1">{item.subtitle}</p>
                    </div>
                  ))
                )}
              </div>
              
              <button onClick={() => onNavigate(OmniModule.SYSTEM_LEDGER)} className="mt-8 w-full py-4 border border-dashed border-gray-800 text-gray-600 hover:text-blue-400 hover:border-blue-400/50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Audit Raw Sovereign Assets</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;
