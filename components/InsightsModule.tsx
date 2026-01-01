
import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  BrainCircuit, 
  TrendingUp, 
  Lightbulb, 
  Loader2, 
  Send, 
  Zap, 
  ShieldCheck, 
  Target,
  ChevronRight,
  Cpu
} from 'lucide-react';
import { getPersonalInsights, getSovereignRoadmap, chatWithPDS } from '../services/geminiService';

interface InsightsModuleProps {
  data: any;
}

const InsightsModule: React.FC<InsightsModuleProps> = ({ data }) => {
  const [insights, setInsights] = useState<any[]>([]);
  const [roadmap, setRoadmap] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const [activeTab, setActiveTab] = useState<'insights' | 'roadmap'>('insights');
  const [messages, setMessages] = useState<{role: 'user'|'model', text: string}[]>([]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
      // Only show full loader on initial entry to prevent "flashing" on data updates
      if (firstLoad) setLoading(true);
      
      try {
        const [insightsRes, roadmapRes] = await Promise.all([
          getPersonalInsights(data),
          getSovereignRoadmap(data)
        ]);
        if (mounted) {
          setInsights(insightsRes.insights || []);
          setRoadmap(roadmapRes.roadmap || []);
          setFirstLoad(false);
        }
      } catch (e) {
        console.error("AI Analysis Error:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    loadData();
    return () => { mounted = false; };
  }, [data]);

  const handleChat = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || chatLoading) return;

    const userMsg = { role: 'user' as const, text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setChatLoading(true);

    try {
      const response = await chatWithPDS([...messages.map(m => ({ role: m.role, parts: [{ text: m.text }] })), { role: 'user', parts: [{ text: input }] }], data);
      setMessages(prev => [...prev, { role: 'model' as const, text: response }]);
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: 'model' as const, text: "Prime AI encountered an encryption bottleneck. Please retry." }]);
    } finally {
      setChatLoading(false);
    }
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
      {/* Strategic Analysis Column */}
      <div className="xl:col-span-7 space-y-6">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-xl border border-blue-500/30">
              <Cpu className={`text-blue-400 ${loading ? 'animate-pulse' : ''}`} size={24} />
            </div>
            <div>
              <h3 className="text-2xl font-bold">Strategic Vision Engine</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                Gemini 3 Pro {loading && <Loader2 size={10} className="animate-spin" />}
              </p>
            </div>
          </div>
          <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
            <button 
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'insights' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Core Insights
            </button>
            <button 
              onClick={() => setActiveTab('roadmap')}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === 'roadmap' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Roadmap
            </button>
          </div>
        </div>

        {loading && firstLoad ? (
          <div className="flex flex-col items-center justify-center py-32 bg-[#0b0f1a] rounded-3xl border border-gray-800 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/5 animate-pulse"></div>
            <Loader2 className="animate-spin text-blue-500 mb-6 relative z-10" size={40} />
            <p className="text-gray-100 font-bold text-lg mb-2 relative z-10">Deep Data Synthesis in Progress</p>
            <p className="text-gray-500 text-sm max-w-xs text-center relative z-10">Correlating Lexicons: social.post, finance.tx, work.task...</p>
          </div>
        ) : activeTab === 'insights' ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800 hover:border-blue-500/40 transition-all group relative overflow-hidden">
                <div className="flex items-start gap-4 relative z-10">
                  <div className="p-3 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 group-hover:bg-blue-500/20 transition-all">
                    {insight.category === 'Financial' ? <TrendingUp size={20} /> : <Zap size={20} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1">
                      <h4 className="font-bold text-lg text-gray-100">{insight.title}</h4>
                      <span className="text-[10px] bg-blue-900/30 text-blue-400 px-2 py-0.5 rounded-md border border-blue-800/50">Urgency: {insight.urgency}/10</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-4">{insight.description}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-tighter text-blue-400 bg-blue-950/40 px-3 py-1.5 rounded-full border border-blue-900/50 w-fit">
                      <Target size={12} /> Strategic Impact: {insight.impact}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && !loading && (
               <div className="py-20 text-center text-gray-500 italic bg-[#0b0f1a] rounded-3xl border border-dashed border-gray-800">
                  No insights generated. Add more data to your PDS.
               </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in duration-300">
            {roadmap.map((item, idx) => (
              <div key={idx} className="relative pl-8 border-l-2 border-gray-800 pb-2">
                <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-gray-950"></div>
                <div className="bg-[#0b0f1a] rounded-2xl border border-gray-800 p-5">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-bold text-blue-400 uppercase text-xs tracking-widest">Week {item.week}: {item.focus}</h5>
                    <span className="text-[10px] text-gray-500 font-mono">{item.financialGoal}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {item.tasks.map((task: string, tIdx: number) => (
                      <div key={tIdx} className="flex items-center gap-2 text-sm text-gray-300">
                        <ChevronRight size={14} className="text-blue-500" /> {task}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
            {roadmap.length === 0 && !loading && (
               <div className="py-20 text-center text-gray-500 italic bg-[#0b0f1a] rounded-3xl border border-dashed border-gray-800">
                  Strategic roadmap awaiting data baseline.
               </div>
            )}
          </div>
        )}
      </div>

      {/* Prime AI Column */}
      <div className="xl:col-span-5">
        <div className="bg-[#0b0f1a] rounded-3xl border border-gray-800 flex flex-col h-[750px] shadow-2xl overflow-hidden relative">
          <div className="p-6 border-b border-gray-800 flex items-center justify-between bg-gray-900/30">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                  <Sparkles className="text-white" size={20} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-4 border-[#0b0f1a] rounded-full"></div>
              </div>
              <div>
                <h4 className="font-bold text-gray-100">PDS Prime AI</h4>
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-wider">Thinking Engine v3.2</span>
                </div>
              </div>
            </div>
            <ShieldCheck className="text-gray-700" size={24} />
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="p-4 bg-blue-500/5 rounded-full mb-6">
                  <Target size={40} className="text-blue-500 opacity-30" />
                </div>
                <h5 className="text-lg font-bold mb-2">Prime Consciousness Active</h5>
                <p className="text-sm text-gray-500 leading-relaxed">
                  "I am synchronized with your Merkle Search Trees. Ask me for cross-module correlations or a strategic audit of your digital sovereignty."
                </p>
                <div className="mt-8 grid grid-cols-2 gap-2 w-full">
                  <button onClick={() => setInput("Audit my burn rate vs social reach")} className="p-3 text-[10px] text-gray-400 border border-gray-800 rounded-xl hover:border-blue-500/50 transition-colors uppercase font-bold">Audit Reach/Burn</button>
                  <button onClick={() => setInput("Optimize my task priorities")} className="p-3 text-[10px] text-gray-400 border border-gray-800 rounded-xl hover:border-blue-500/50 transition-colors uppercase font-bold">Task Optimization</button>
                </div>
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-lg' : 'bg-gray-800 text-gray-100 rounded-tl-none border border-gray-700 shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-gray-800 p-4 rounded-2xl rounded-tl-none border border-gray-700 flex flex-col gap-3 w-64">
                   <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                    <span className="text-[10px] font-bold text-gray-500 uppercase ml-2 tracking-widest">Reasoning...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChat} className="p-6 border-t border-gray-800 bg-gray-900/30 backdrop-blur-sm">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Consult the Prime Consciousness..."
                className="w-full bg-gray-950 border-gray-800 rounded-2xl px-5 py-4 pr-16 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm placeholder-gray-700"
              />
              <button 
                type="submit"
                className="absolute right-2 top-2 p-2.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all text-white shadow-lg shadow-blue-900/40 active:scale-95"
              >
                <Send size={20} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsightsModule;
