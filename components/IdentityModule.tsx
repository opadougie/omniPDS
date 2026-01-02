
import React, { useState, useEffect } from 'react';
import { Fingerprint, ShieldCheck, Key, Globe, Plus, MoreHorizontal, ExternalLink, RefreshCw } from 'lucide-react';
import * as dbService from '../services/dbService';
import { Credential } from '../types';

const IdentityModule: React.FC = () => {
  const [creds, setCreds] = useState<Credential[]>([]);
  const [did, setDid] = useState('did:plc:omni8927-beta-node');

  useEffect(() => {
    setCreds(dbService.getCredentials());
  }, []);

  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black tracking-tighter">Sovereign Identity</h3>
          <p className="text-gray-500 text-sm">Managing your cryptographic presence across the federation.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl shadow-xl transition-all"><Plus /></button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main DID Card */}
        <div className="lg:col-span-8 space-y-8">
          <div className="p-10 bg-gradient-to-br from-blue-600/20 to-indigo-900/20 border border-blue-500/20 rounded-[3rem] shadow-2xl relative overflow-hidden group">
             <div className="relative z-10">
                <div className="flex items-center justify-between mb-12">
                   <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-3xl bg-blue-600 flex items-center justify-center shadow-2xl shadow-blue-500/40">
                         <Fingerprint className="text-white" size={32} />
                      </div>
                      <div>
                         <h4 className="text-2xl font-black">Primary Identity</h4>
                         <p className="text-blue-400 text-xs font-bold uppercase tracking-widest">PLC Directory Verified</p>
                      </div>
                   </div>
                   <ShieldCheck className="text-green-500" size={40} />
                </div>
                
                <div className="space-y-4">
                   <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest">Public Identifier</p>
                   <div className="p-5 bg-gray-950/80 border border-gray-800 rounded-3xl flex items-center justify-between group-hover:border-blue-500/30 transition-all">
                      <code className="text-blue-400 font-mono text-sm">{did}</code>
                      <button className="p-2 text-gray-600 hover:text-white"><ExternalLink size={16}/></button>
                   </div>
                </div>

                <div className="grid grid-cols-2 gap-6 mt-12">
                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Key Strength</p>
                      <p className="text-xl font-black">Ed25519</p>
                   </div>
                   <div className="p-6 bg-white/5 border border-white/5 rounded-3xl">
                      <p className="text-[10px] text-gray-500 font-bold uppercase mb-2">Handle Status</p>
                      <p className="text-xl font-black text-green-400 font-mono">me.pds</p>
                   </div>
                </div>
             </div>
             <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/10 rounded-full blur-[100px] -mr-48 -mt-48"></div>
          </div>

          <div className="space-y-4">
             <h5 className="text-lg font-bold px-4 flex items-center gap-3">
                <Key className="text-amber-500" size={20} /> Verifiable Credentials
             </h5>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {creds.map(c => (
                  <div key={c.id} className="p-6 bg-[#080b12] border border-gray-900 rounded-3xl hover:border-gray-700 transition-all flex items-center justify-between">
                     <div className="flex items-center gap-4">
                        <div className="p-3 bg-gray-950 rounded-2xl text-blue-400"><ShieldCheck size={20}/></div>
                        <div>
                           <p className="font-bold">{c.type}</p>
                           <p className="text-[10px] text-gray-600 uppercase font-black">{c.issuer}</p>
                        </div>
                     </div>
                     <MoreHorizontal className="text-gray-700" size={18} />
                  </div>
                ))}
                {creds.length === 0 && (
                  <div className="col-span-full py-16 text-center border-2 border-dashed border-gray-900 rounded-[2rem] text-gray-600 italic">No VC artifacts registered.</div>
                )}
             </div>
          </div>
        </div>

        {/* Sidebar Info */}
        <div className="lg:col-span-4 space-y-6">
           <div className="p-8 bg-[#080b12] border border-gray-900 rounded-[2.5rem]">
              <h4 className="font-bold mb-6 flex items-center gap-2">
                 <Globe className="text-indigo-400" size={18} /> Federation Status
              </h4>
              <div className="space-y-6">
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Global Relay Reach</span>
                    <span className="text-green-400 font-bold">100%</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">Signature Latency</span>
                    <span className="text-gray-300">12ms</span>
                 </div>
                 <div className="flex justify-between items-center text-xs">
                    <span className="text-gray-500">PLC Propagation</span>
                    <span className="text-blue-400">Verified</span>
                 </div>
                 <button className="w-full py-4 border border-dashed border-gray-800 rounded-2xl text-[10px] font-black uppercase text-gray-500 hover:text-white hover:border-gray-700 transition-all flex items-center justify-center gap-2">
                    <RefreshCw size={12}/> Rotate Keypair
                 </button>
              </div>
           </div>

           <div className="p-8 bg-amber-600/5 border border-amber-500/10 rounded-[2.5rem]">
              <h4 className="font-bold text-amber-500 mb-2">Security Advisory</h4>
              <p className="text-xs text-gray-500 leading-relaxed">Your recovery shard is stored in the local SQLite ledger. It is highly recommended to export a backup to an external sovereign vault.</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default IdentityModule;
