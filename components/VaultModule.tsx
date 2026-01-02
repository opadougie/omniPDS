
import React, { useState } from 'react';
import { BookOpen, Plus, Tag, Calendar, Search, FileText } from 'lucide-react';
import { Note } from '../types';

interface VaultModuleProps {
  notes: Note[];
  onAdd: (title: string, content: string, tags: string) => void;
}

const VaultModule: React.FC<VaultModuleProps> = ({ notes, onAdd }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [tags, setTags] = useState('');
  const [filter, setFilter] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (title && content) {
      onAdd(title, content, tags);
      setTitle(''); setContent(''); setTags(''); setShowAdd(false);
    }
  };

  const filtered = notes.filter(n => n.title.toLowerCase().includes(filter.toLowerCase()) || n.tags.toLowerCase().includes(filter.toLowerCase()));

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-2xl font-bold">Universal Vault</h3>
          <p className="text-gray-500 text-sm">Your private knowledge graph and research ledger.</p>
        </div>
        <button onClick={() => setShowAdd(!showAdd)} className="bg-blue-600 hover:bg-blue-500 p-3 rounded-2xl shadow-lg transition-all"><Plus /></button>
      </div>

      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input 
          type="text" value={filter} onChange={e=>setFilter(e.target.value)}
          placeholder="Search through your consciousness..."
          className="w-full bg-[#0b0f1a] border border-gray-800 rounded-2xl py-3.5 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500 transition-all"
        />
      </div>

      {showAdd && (
        <form onSubmit={handleSubmit} className="p-6 bg-[#0b0f1a] rounded-3xl border border-blue-500/30 space-y-4 animate-in slide-in-from-top-4">
          <input 
            type="text" placeholder="Entry Title" value={title} onChange={e=>setTitle(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 text-lg font-bold"
          />
          <textarea 
            placeholder="Write your research or thoughts here (Markdown supported)..." value={content} onChange={e=>setContent(e.target.value)}
            className="w-full bg-gray-950 border border-gray-800 rounded-xl px-4 py-3 h-48 resize-none"
          />
          <div className="flex gap-2">
            <input 
              type="text" placeholder="Tags (comma separated)" value={tags} onChange={e=>setTags(e.target.value)}
              className="flex-1 bg-gray-950 border border-gray-800 rounded-xl px-4 py-2 text-sm"
            />
            <button type="submit" className="bg-blue-600 px-8 rounded-xl font-bold">Store</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map(note => (
          <div key={note.id} className="p-6 bg-[#0b0f1a] border border-gray-800 rounded-3xl hover:border-blue-500/40 transition-all group">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-blue-600/10 text-blue-400 rounded-xl group-hover:bg-blue-600 group-hover:text-white transition-all"><FileText size={20}/></div>
              <div className="text-[10px] font-bold text-gray-600 flex items-center gap-1 uppercase tracking-widest"><Calendar size={10}/> {new Date(note.updatedAt).toLocaleDateString()}</div>
            </div>
            <h4 className="font-bold text-lg mb-2">{note.title}</h4>
            <p className="text-gray-500 text-sm line-clamp-3 mb-4">{note.content}</p>
            <div className="flex flex-wrap gap-2">
              {note.tags.split(',').map((t, i) => (
                <span key={i} className="px-2 py-0.5 bg-gray-950 border border-gray-800 rounded text-[9px] text-blue-400 font-bold uppercase tracking-widest">{t.trim()}</span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default VaultModule;
