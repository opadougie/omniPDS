
import React, { useState, useEffect } from 'react';
// Added MoreHorizontal to imports
import { Image, File, MoreVertical, Plus, Grid, List, Search, HardDrive, MoreHorizontal } from 'lucide-react';
import * as dbService from '../services/dbService';
import { MediaAsset } from '../types';

const MediaModule: React.FC = () => {
  const [media, setMedia] = useState<MediaAsset[]>([]);
  const [view, setView] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    setMedia(dbService.getMedia());
  }, []);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h3 className="text-3xl font-black tracking-tighter">Sovereign Media Hub</h3>
          <p className="text-gray-500 text-sm">Unified registry for all digital assets and blobs.</p>
        </div>
        <div className="flex items-center gap-3">
           <div className="flex bg-gray-950 border border-gray-800 rounded-xl p-1">
              <button onClick={()=>setView('grid')} className={`p-2 rounded-lg ${view === 'grid' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}><Grid size={16}/></button>
              <button onClick={()=>setView('list')} className={`p-2 rounded-lg ${view === 'list' ? 'bg-blue-600 text-white' : 'text-gray-600'}`}><List size={16}/></button>
           </div>
           <button className="bg-blue-600 hover:bg-blue-500 p-3 rounded-xl shadow-xl transition-all"><Plus size={20}/></button>
        </div>
      </div>

      <div className="relative">
         <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600" size={18} />
         <input type="text" placeholder="Search CID, Name, or MIME type..." className="w-full bg-[#080b12] border border-gray-800 rounded-2xl py-4 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-600/50" />
      </div>

      {media.length === 0 ? (
        <div className="py-32 flex flex-col items-center justify-center text-gray-700 bg-[#080b12] rounded-[3rem] border-2 border-dashed border-gray-900">
           <HardDrive size={64} className="mb-6 opacity-10" />
           <p className="font-bold text-sm uppercase tracking-widest opacity-20">No blobs detected in local storage</p>
           <button className="mt-8 text-blue-500 font-bold text-xs uppercase hover:underline">Initialise Ingestion Protocol</button>
        </div>
      ) : (
        <div className={view === 'grid' ? "grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-6" : "space-y-2"}>
           {media.map(m => (
             <div key={m.id} className={`bg-[#080b12] border border-gray-900 rounded-3xl hover:border-gray-700 transition-all p-4 group ${view === 'list' ? 'flex items-center gap-4' : ''}`}>
                <div className={`rounded-2xl bg-gray-950 flex items-center justify-center text-blue-400 group-hover:bg-blue-600/10 transition-all ${view === 'list' ? 'w-12 h-12' : 'aspect-square w-full mb-4'}`}>
                   {m.mimeType.includes('image') ? <Image size={view === 'list' ? 20 : 32}/> : <File size={view === 'list' ? 20 : 32}/>}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="font-bold text-sm truncate">{m.name}</p>
                   <p className="text-[10px] text-gray-600 font-mono truncate">{m.cid}</p>
                </div>
                <button className="text-gray-800 hover:text-white"><MoreHorizontal size={18}/></button>
             </div>
           ))}
        </div>
      )}
    </div>
  );
};

export default MediaModule;
