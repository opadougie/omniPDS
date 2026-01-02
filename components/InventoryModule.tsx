
import React, { useState } from 'react';
import { Box, Plus, Search, Tag, MapPin, DollarSign, Calendar, HardDrive } from 'lucide-react';
import { Asset } from '../types';

interface InventoryModuleProps {
  assets: Asset[];
  onAdd: (a: Omit<Asset, 'id'>) => void;
}

const InventoryModule: React.FC<InventoryModuleProps> = ({ assets, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', serial: '', value: '', category: 'Hardware', location: '', purchaseDate: new Date().toISOString().split('T')[0] });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name) {
      onAdd({ ...form, value: parseFloat(form.value) || 0 });
      setForm({ name: '', serial: '', value: '', category: 'Hardware', location: '', purchaseDate: new Date().toISOString().split('T')[0] });
      setShowAdd(false);
    }
  };

  const totalValue = assets.reduce((sum, a) => sum + a.value, 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h3 className="text-2xl font-bold">Asset Ledger</h3>
          <p className="text-gray-500 text-sm">Universal tracking of your physical infrastructure and gear.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="bg-[#0b0f1a] border border-gray-800 rounded-2xl px-6 py-2">
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Valuation</p>
              <p className="text-xl font-bold text-blue-400">${totalValue.toLocaleString()}</p>
           </div>
           <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-2xl shadow-lg transition-all"><Plus /></button>
        </div>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="p-8 bg-[#0b0f1a] rounded-3xl border border-blue-500/30 grid grid-cols-1 md:grid-cols-2 gap-6 animate-in slide-in-from-top-4">
          <div className="space-y-4">
            <input type="text" placeholder="Item Name (e.g. MiniPC Ubuntu)" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 font-bold" required />
            <input type="text" placeholder="Serial Number / ID" value={form.serial} onChange={e=>setForm({...form, serial:e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm" />
            <input type="number" placeholder="Value (USD)" value={form.value} onChange={e=>setForm({...form, value:e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm" />
          </div>
          <div className="space-y-4">
            <select value={form.category} onChange={e=>setForm({...form, category:e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm">
              <option>Hardware</option>
              <option>Infrastructure</option>
              <option>Gear</option>
              <option>Real Estate</option>
            </select>
            <input type="text" placeholder="Location (e.g. Home Office)" value={form.location} onChange={e=>setForm({...form, location:e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm" />
            <input type="date" value={form.purchaseDate} onChange={e=>setForm({...form, purchaseDate:e.target.value})} className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-sm" />
          </div>
          <button type="submit" className="md:col-span-2 bg-blue-600 py-3 rounded-xl font-bold hover:bg-blue-500 transition-all">Commit to Ledger</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {assets.map(asset => (
          <div key={asset.id} className="p-6 bg-[#0b0f1a] border border-gray-800 rounded-3xl group hover:border-blue-500/40 transition-all">
            <div className="flex items-start justify-between mb-4">
               <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all">
                  {asset.category === 'Hardware' ? <HardDrive size={20}/> : <Box size={20}/>}
               </div>
               <span className="text-[10px] font-bold text-gray-600 uppercase tracking-widest bg-gray-950 px-2 py-1 rounded border border-gray-800">{asset.category}</span>
            </div>
            <h4 className="font-bold text-lg mb-1">{asset.name}</h4>
            <p className="text-gray-500 text-xs font-mono mb-4">{asset.serial || 'No Serial Recorded'}</p>
            
            <div className="grid grid-cols-2 gap-4 border-t border-gray-800 pt-4">
               <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <MapPin size={12} className="text-blue-500"/> {asset.location}
               </div>
               <div className="flex items-center gap-2 text-[11px] text-gray-400">
                  <DollarSign size={12} className="text-green-500"/> ${asset.value.toLocaleString()}
               </div>
               <div className="flex items-center gap-2 text-[11px] text-gray-400 col-span-2 mt-1">
                  <Calendar size={12} className="text-amber-500"/> Registered: {new Date(asset.purchaseDate).toLocaleDateString()}
               </div>
            </div>
          </div>
        ))}
        {assets.length === 0 && (
           <div className="md:col-span-3 py-20 text-center border-2 border-dashed border-gray-800 rounded-3xl text-gray-500">
              No physical assets indexed. Start by clicking the '+' button.
           </div>
        )}
      </div>
    </div>
  );
};
export default InventoryModule;
