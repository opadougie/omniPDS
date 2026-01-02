
import React from 'react';
import { Workflow, Zap, Settings, ShieldCheck, ToggleLeft, MoreVertical, Plus } from 'lucide-react';
import { WorkflowRule } from '../types';

interface WorkflowModuleProps {
  workflows: WorkflowRule[];
}

const WorkflowModule: React.FC<WorkflowModuleProps> = ({ workflows }) => {
  return (
    <div className="space-y-10 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-3xl font-black tracking-tighter text-white">Automation Engine</h3>
          <p className="text-gray-500 text-sm font-medium">Define algorithmic rules for your sovereign data lifecycle.</p>
        </div>
        <button className="bg-blue-600 hover:bg-blue-500 p-4 rounded-2xl shadow-xl transition-all"><Plus /></button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {workflows.length === 0 ? (
          <div className="col-span-full py-24 text-center border-2 border-dashed border-gray-900 rounded-[2.5rem]">
             <Workflow size={48} className="mx-auto mb-6 text-gray-800" />
             <p className="text-gray-500 text-sm max-w-xs mx-auto italic">No active triggers. Create your first automated data rule to offload cognitive tasks to the OmniPDS Core.</p>
          </div>
        ) : (
          workflows.map((w) => (
            <div key={w.id} className="p-8 bg-[#080b12] rounded-[2.5rem] border border-gray-900 hover:border-blue-500/20 transition-all group relative overflow-hidden">
               <div className="flex items-center justify-between mb-6">
                  <div className={`p-3 rounded-2xl ${w.active ? 'bg-blue-600/10 text-blue-400' : 'bg-gray-800 text-gray-600'}`}>
                    <Zap size={24}/>
                  </div>
                  <button className="text-gray-700 hover:text-white transition-colors"><MoreVertical size={20}/></button>
               </div>
               <h4 className="font-bold text-lg mb-2 text-white">{w.name}</h4>
               <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest mb-6">Trigger: {w.triggerType}</p>
               
               <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-900 mb-6 font-mono text-xs text-blue-300">
                  IF <span className="text-amber-500">{w.condition}</span> THEN <span className="text-green-400">{w.action}</span>
               </div>

               <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${w.active ? 'bg-green-500 shadow-lg shadow-green-500/50 animate-pulse' : 'bg-gray-700'}`}></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tighter">{w.active ? 'Active' : 'Disabled'}</span>
                  </div>
                  <button className={`text-xs font-bold transition-colors ${w.active ? 'text-blue-400 hover:text-blue-300' : 'text-gray-600'}`}>
                    Configure Engine
                  </button>
               </div>
            </div>
          ))
        )}
      </div>

      <div className="p-8 bg-gradient-to-br from-indigo-900/10 to-transparent rounded-[2.5rem] border border-indigo-900/20 flex flex-col md:flex-row items-center gap-8">
         <div className="p-6 bg-indigo-600/10 rounded-3xl text-indigo-400"><ShieldCheck size={40} /></div>
         <div className="flex-1">
            <h4 className="text-xl font-black mb-1">Local-First Privacy Guard</h4>
            <p className="text-gray-500 text-sm">All workflow logic is executed on your local PDS node. No data is leaked to external cloud providers for processing. Your automation remains sovereign.</p>
         </div>
         <button className="px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] transition-all">Audit Security Logs</button>
      </div>
    </div>
  );
};

export default WorkflowModule;
