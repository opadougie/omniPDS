import React from 'react';
import { OmniModule } from '../types';
import { 
  Activity, ShieldCheck, Database, Globe, CreditCard, 
  Zap, ExternalLink, Target, ZapOff, TrendingUp, Clock, AlertTriangle 
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
    { label: 'System Integrity', value: '100%', icon: <ShieldCheck />, color: 'text-green-400', bg: 'bg-green-400/5', border: 'border-green-400/20' },
    { label: 'Life Velocity', value: '8.4 ops', icon: <Activity />, color: 'text-purple-400', bg: 'bg-purple-400/5', border: 'border-purple-400/20' },
    { label: 'Node Uptime', value: '99.9%', icon: <Zap />, color: 'text-amber-400', bg: 'bg-amber-400/5', border: 'border-amber-400/20' },
  ];

  return (
    <div className="space-y-10 animate-in fade-in duration-700">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {highlights.map((h, i) => (
          <div key={i} className={`p-6 rounded-3xl border ${h.bg} ${h.border} transition-transform hover:scale-[1.02] cursor-default shadow-sm`}>
            {/* Fix: Cast icon to React.ReactElement with size prop to resolve TypeScript error */}
            <div className={`mb-4 ${h.color}`}>{React.cloneElement(h.icon as React.ReactElement<{ size?: number }>, { size: 24 })}</div>
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">{h.label}</p>
            <h4 className="text-3xl font-black mt-1 tracking-tight">{h.value}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 shadow-2xl relative overflow-hidden">
             <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-black tracking-tight">Biometric & Activity Correlation</h3>
                  <p className="text-gray-500 text-sm">Visualizing performance delta across 7 dynamic intervals.</p>
                </div>
                <div className="flex gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Activity</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase">Health</span>
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900">
               <h4 className="text-lg font-bold mb-6 flex items-center gap-3">
                  <Target className="text-blue-500" size={20} /> Sovereign Targets
               </h4>
               <div className="space-y-6">
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-tighter">
                      <span className="text-gray-400">Monthly Burn Limit</span>
                      <span className="text-blue-400">72% Used</span>
                    </div>
                    <div className="h-2 w-full bg-gray-950 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full" style={{width: '72%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between text-xs font-bold mb-2 uppercase tracking-tighter">
                      <span className="text-gray-400">Protocol Consensus</span>
                      <span className="text-green-400">Verified</span>
                    </div>
                    <div className="h-2 w-full bg-gray-950 rounded-full overflow-hidden">
                      <div className="h-full bg-green-600 rounded-full animate-pulse" style={{width: '100%'}}></div>
                    </div>
                  </div>
                  <button onClick={() => onNavigate(OmniModule.PROJECTS)} className="w-full py-4 bg-gray-900 hover:bg-gray-800 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Audit Mission Progress</button>
               </div>
            </div>
            <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900">
               <h4 className="text-lg font-bold mb-6 flex items-center gap-3">
                  <TrendingUp className="text-indigo-400" size={20} /> Wealth Distribution
               </h4>
               <div className="h-40 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData.slice(-5)}>
                      <Bar dataKey="spend" fill="#6366f1" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="flex justify-between mt-6">
                 <div className="text-center">
                   <p className="text-[10px] text-gray-500 font-bold uppercase">Fiat</p>
                   <p className="font-black text-white">82%</p>
                 </div>
                 <div className="text-center">
                   <p className="text-[10px] text-gray-500 font-bold uppercase">Web3</p>
                   <p className="font-black text-indigo-400">18%</p>
                 </div>
                 <div className="text-center">
                   <p className="text-[10px] text-gray-500 font-bold uppercase">Yield</p>
                   <p className="font-black text-green-400">+4.2%</p>
                 </div>
               </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-4 space-y-8">
           <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 flex flex-col h-[760px]">
              <div className="flex items-center justify-between mb-8">
                 <h4 className="text-xl font-black">Life Firehose</h4>
                 <div className="px-3 py-1 bg-gray-950 border border-gray-800 rounded-full flex items-center gap-2">
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></span>
                    <span className="text-[9px] font-black text-gray-500 uppercase tracking-widest">Realtime</span>
                 </div>
              </div>
              
              <div className="flex-1 overflow-y-auto custom-scrollbar space-y-4 pr-2">
                {feed.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center px-6 text-gray-600 italic">
                     <Clock size={32} className="mb-4 opacity-10" />
                     <p className="text-sm">No PDS activity detected. Start interacting with modules to populate your sovereign ledger.</p>
                  </div>
                ) : (
                  feed.map((item, idx) => (
                    <div key={idx} className="p-4 bg-gray-950/50 rounded-2xl border border-gray-900 hover:border-gray-800 transition-all group">
                       <div className="flex items-center justify-between mb-2">
                          <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded ${
                            item.type === 'SOCIAL' ? 'text-blue-400 bg-blue-400/10' : 
                            item.type === 'FINANCE' ? 'text-green-400 bg-green-400/10' : 
                            'text-amber-400 bg-amber-400/10'
                          }`}>
                            {item.type}
                          </span>
                          <span className="text-[9px] text-gray-600 font-mono">{item.date?.slice(5, 16)}</span>
                       </div>
                       <p className="text-sm font-bold text-gray-200 truncate">{item.title}</p>
                       <p className="text-[10px] text-gray-500 mt-1">{item.subtitle}</p>
                    </div>
                  ))
                )}
              </div>
              
              <button onClick={() => onNavigate(OmniModule.SYSTEM_LEDGER)} className="mt-8 w-full py-4 border border-dashed border-gray-800 text-gray-600 hover:text-blue-400 hover:border-blue-400/50 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all">Audit Full Lifecycle</button>
           </div>

           <div className="p-8 bg-gradient-to-br from-red-950/20 to-transparent rounded-[2.5rem] border border-red-900/10 flex items-center justify-between group cursor-pointer hover:border-red-900/30 transition-all">
              <div className="flex items-center gap-4">
                 <div className="p-3 bg-red-900/10 rounded-2xl text-red-500 group-hover:scale-110 transition-transform"><AlertTriangle size={24}/></div>
                 <div>
                    <h5 className="font-bold">Encryption Status</h5>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">Post-Quantum Enabled</p>
                 </div>
              </div>
              <ExternalLink size={16} className="text-gray-800 group-hover:text-red-500 transition-colors" />
           </div>
        </div>
      </div>
    </div>
  );
};

export default CommandCenter;