
import React, { useState } from 'react';
import { Activity, Heart, Moon, Zap, Target, Plus, ChevronRight, TrendingUp } from 'lucide-react';
import { HealthMetric } from '../types';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';

interface HealthModuleProps {
  health: HealthMetric[];
  onAdd: (m: Omit<HealthMetric, 'id'>) => void;
}

const HealthModule: React.FC<HealthModuleProps> = ({ health, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ type: 'Sleep' as HealthMetric['type'], value: '', unit: 'hrs' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.value) {
      onAdd({ ...form, value: parseFloat(form.value), date: new Date().toISOString() });
      setForm({ type: 'Sleep', value: '', unit: 'hrs' });
      setShowAdd(false);
    }
  };

  const chartData = health.filter(h => h.type === 'Energy').map(h => ({ date: h.date.slice(5, 10), val: h.value })).reverse();

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black tracking-tighter">Bio-Performance Matrix</h3>
          <p className="text-gray-500 text-sm">High-fidelity tracking of your biological infrastructure.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl shadow-xl transition-all"><Plus /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900">
            <h4 className="text-lg font-bold mb-8 flex items-center gap-3"><TrendingUp className="text-blue-500" size={20} /> Cognitive Energy Trend</h4>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" opacity={0.3} />
                  <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#4b5563', fontSize: 10}} />
                  <YAxis hide />
                  <Tooltip contentStyle={{ backgroundColor: '#02040a', border: '1px solid #1f2937', borderRadius: '16px' }} />
                  <Line type="monotone" dataKey="val" stroke="#3b82f6" strokeWidth={4} dot={{ r: 4, fill: '#3b82f6' }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {health.slice(0, 6).map((m) => (
              <div key={m.id} className="p-6 bg-[#080b12] rounded-3xl border border-gray-900 flex items-center justify-between group">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-950 rounded-2xl text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {m.type === 'Sleep' ? <Moon size={20}/> : m.type === 'Energy' ? <Zap size={20}/> : <Heart size={20}/>}
                  </div>
                  <div>
                    <h5 className="font-bold text-gray-100">{m.type}</h5>
                    <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest">{m.date.slice(0, 10)}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-black text-white">{m.value}<span className="text-xs text-gray-600 ml-1 font-normal">{m.unit}</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-4 space-y-6">
          {showAdd && (
            <form onSubmit={handleSubmit} className="p-8 bg-blue-600/5 border border-blue-500/20 rounded-[2.5rem] space-y-4 animate-in slide-in-from-right-4">
              <h4 className="font-black text-blue-400 uppercase tracking-widest text-xs mb-4">Log Biometric Entry</h4>
              <select 
                value={form.type} onChange={e => setForm({...form, type: e.target.value as any})}
                className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-sm"
              >
                <option>Sleep</option>
                <option>HeartRate</option>
                <option>Energy</option>
                <option>Mood</option>
                <option>Weight</option>
              </select>
              <div className="flex gap-2">
                <input 
                  type="number" placeholder="Value" value={form.value} onChange={e => setForm({...form, value: e.target.value})}
                  className="flex-1 bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-sm"
                />
                <input 
                  type="text" placeholder="Unit" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})}
                  className="w-24 bg-gray-950 border border-gray-800 rounded-2xl px-5 py-4 text-sm"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 py-4 rounded-2xl font-black uppercase tracking-widest text-[10px]">Commit Metric</button>
            </form>
          )}

          <div className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900">
             <h4 className="font-bold mb-6">Cognitive Load Check</h4>
             <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-gray-950/50 rounded-2xl border border-gray-900">
                   <span className="text-xs font-medium text-gray-400">Restfulness</span>
                   <span className="text-green-400 font-bold">Optimal</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-950/50 rounded-2xl border border-gray-900">
                   <span className="text-xs font-medium text-gray-400">Stress Level</span>
                   <span className="text-amber-400 font-bold">Moderate</span>
                </div>
                <div className="flex items-center justify-between p-4 bg-gray-950/50 rounded-2xl border border-gray-900">
                   <span className="text-xs font-medium text-gray-400">HRV Delta</span>
                   <span className="text-blue-400 font-bold">+12ms</span>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HealthModule;
