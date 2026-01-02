
import React, { useState } from 'react';
import { UserPlus, Search, Phone, Mail, Globe, Clock, Star } from 'lucide-react';
import { Contact } from '../types';

interface PulseModuleProps {
  contacts: Contact[];
  onAdd: (c: Omit<Contact, 'id'>) => void;
}

const PulseModule: React.FC<PulseModuleProps> = ({ contacts, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ name: '', handle: '', category: 'Strategic' as Contact['category'], notes: '' });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (form.name) {
      onAdd({ ...form, lastContacted: new Date().toISOString() });
      setForm({ name: '', handle: '', category: 'Strategic', notes: '' });
      setShowAdd(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">The Pulse</h3>
          <p className="text-gray-500 text-sm">Strategic relationship management and social graph.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-2xl shadow-lg transition-all"><UserPlus /></button>
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="p-6 bg-[#0b0f1a] rounded-3xl border border-green-500/30 space-y-4 animate-in slide-in-from-top-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Full Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 font-bold"
            />
            <input 
              type="text" placeholder="Digital Handle (@user)" value={form.handle} onChange={e=>setForm({...form, handle:e.target.value})}
              className="bg-gray-950 border border-gray-800 rounded-xl px-4 py-3"
            />
          </div>
          <select 
            value={form.category} onChange={e=>setForm({...form, category:e.target.value as any})}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3"
          >
            <option>Professional</option>
            <option>Personal</option>
            <option>Strategic</option>
          </select>
          <textarea 
            placeholder="Context or notes about this person..." value={form.notes} onChange={e=>setForm({...form, notes:e.target.value})}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 h-24 resize-none"
          />
          <button type="submit" className="w-full bg-blue-600 py-3 rounded-xl font-bold">Register Pulse</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contacts.map(contact => (
          <div key={contact.id} className="p-5 bg-[#0b0f1a] border border-gray-800 rounded-3xl flex items-center justify-between group hover:bg-gray-900/40 transition-all">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-gray-800 to-gray-950 flex items-center justify-center font-bold text-xl text-blue-500 border border-gray-800">
                {contact.name.charAt(0)}
              </div>
              <div>
                <h4 className="font-bold">{contact.name}</h4>
                <p className="text-[10px] font-mono text-gray-500">{contact.handle || 'No Handle'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-[9px] px-2 py-0.5 rounded border ${
                    contact.category === 'Strategic' ? 'border-amber-500/20 text-amber-500 bg-amber-500/5' : 
                    contact.category === 'Professional' ? 'border-blue-500/20 text-blue-500 bg-blue-500/5' : 'border-green-500/20 text-green-500 bg-green-500/5'
                  } font-bold uppercase tracking-widest`}>{contact.category}</span>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[10px] text-gray-600 font-bold uppercase tracking-tighter flex items-center gap-1 justify-end">
                <Clock size={10}/> Last Pulse: {new Date(contact.lastContacted).toLocaleDateString()}
              </div>
              <div className="flex gap-2 mt-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="p-2 bg-gray-950 border border-gray-800 rounded-lg hover:text-blue-400"><Mail size={14}/></button>
                <button className="p-2 bg-gray-950 border border-gray-800 rounded-lg hover:text-green-400"><Phone size={14}/></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default PulseModule;
