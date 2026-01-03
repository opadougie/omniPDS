
import React, { useState, useEffect, useRef } from 'react';
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
  Cpu,
  Terminal as TerminalIcon
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
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, chatLoading]);

  useEffect(() => {
    let mounted = true;
    const loadData = async () => {
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
      setMessages(prev => [...prev, { role: 'model' as const, text: "Prime AI encountered a cognitive sync bottleneck. Check your API key or ledger health." }]);
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
              <h3 className="text-2xl font-black tracking-tight">Strategic Vision Engine</h3>
              <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest flex items-center gap-2">
                Gemini 3 Pro {loading && <Loader2 size={10} className="animate-spin" />}
              </p>
            </div>
          </div>
          <div className="flex bg-gray-900 rounded-xl p-1 border border-gray-800">
            <button 
              onClick={() => setActiveTab('insights')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'insights' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Core Insights
            </button>
            <button 
              onClick={() => setActiveTab('roadmap')}
              className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${activeTab === 'roadmap' ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'text-gray-500 hover:text-gray-300'}`}
            >
              Sovereign Roadmap
            </button>
          </div>
        </div>

        {loading && firstLoad ? (
          <div className="flex flex-col items-center justify-center py-32 bg-[#0b0f1a] rounded-[2.5rem] border border-gray-900 relative overflow-hidden group">
            <div className="absolute inset-0 bg-blue-600/5 animate-pulse"></div>
            <Loader2 className="animate-spin text-blue-500 mb-6 relative z-10" size={40} />
            <p className="text-gray-100 font-bold text-lg mb-2 relative z-10">Cross-Module Data Synthesis</p>
            <p className="text-gray-500 text-xs font-mono max-w-xs text-center relative z-10 uppercase tracking-widest">Audit: social.tx + bio.matrix + wallet.delta</p>
          </div>
        ) : activeTab === 'insights' ? (
          <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {insights.map((insight, idx) => (
              <div key={idx} className="p-8 bg-[#0b0f1a] rounded-[2.5rem] border border-gray-900 hover:border-blue-500/40 transition-all group relative overflow-hidden">
                <div className="flex items-start gap-6 relative z-10">
                  <div className="p-4 bg-blue-500/10 rounded-2xl text-blue-400 border border-blue-500/20 group-hover:bg-blue-600 group-hover:text-white transition-all">
                    {insight.category === 'Financial' ? <TrendingUp size={24} /> : <Zap size={24} />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-black text-xl text-gray-100">{insight.title}</h4>
                      <span className="text-[10px] bg-blue-900/30 text-blue-400 px-3 py-1 rounded-lg border border-blue-800/50 font-black uppercase tracking-widest">Urgency: {insight.urgency}/10</span>
                    </div>
                    <p className="text-gray-400 text-sm leading-relaxed mb-6">{insight.description}</p>
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400 bg-blue-950/40 px-4 py-2 rounded-xl border border-blue-900/50 w-fit">
                      <Target size={12} fill="currentColor" /> Impact: {insight.impact}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {insights.length === 0 && !loading && (
               <div className="py-20 text-center text-gray-500 italic bg-[#0b0f1a] rounded-[2.5rem] border border-dashed border-gray-900">
                  Insufficient ledger density. Add more life records for analysis.
               </div>
            )}
          </div>
        ) : (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {roadmap.map((item, idx) => (
              <div key={idx} className="relative pl-10 border-l-2 border-gray-800 pb-2">
                <div className="absolute -left-[11px] top-0 w-5 h-5 rounded-full bg-blue-600 border-4 border-gray-950 shadow-lg shadow-blue-500/40"></div>
                <div className="bg-[#0b0f1a] rounded-[2rem] border border-gray-900 p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h5 className="font-black text-blue-400 uppercase text-xs tracking-[0.2em]">Interval {item.week}: {item.focus}</h5>
                    <span className="text-[10px] text-gray-500 font-mono bg-gray-950 px-3 py-1 rounded-full border border-gray-800">{item.financialGoal}</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {item.tasks.map((task: string, tIdx: number) => (
                      <div key={tIdx} className="flex items-center gap-3 text-sm text-gray-300 font-medium">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50"></div> {task}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Prime AI Column */}
      <div className="xl:col-span-5">
        <div className="bg-[#0b0f1a] rounded-[3rem] border border-gray-900 flex flex-col h-[800px] shadow-2xl overflow-hidden relative">
          <div className="p-8 border-b border-gray-900 flex items-center justify-between bg-gray-900/30">
            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-2xl shadow-blue-500/30">
                  <Sparkles className="text-white" size={24} />
                </div>
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 border-4 border-[#0b0f1a] rounded-full"></div>
              </div>
              <div>
                <h4 className="font-black text-lg text-gray-100 tracking-tight">Prime Consciousness</h4>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-blue-400 font-black uppercase tracking-[0.2em]">Node Active</span>
                </div>
              </div>
            </div>
            <ShieldCheck className="text-gray-700" size={28} />
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-8">
                <div className="p-6 bg-blue-500/5 rounded-full mb-8">
                  <BrainCircuit size={48} className="text-blue-500 opacity-20" />
                </div>
                <h5 className="text-xl font-black mb-4">Sovereign Intel Interface</h5>
                <p className="text-sm text-gray-500 leading-relaxed font-medium">
                  "I am interfaced with your SQLite ledger via SQL-Generation and FTS5 search tools. Ask me to correlate your health trends with financial performance, or audit your social reach."
                </p>
                <div className="mt-10 space-y-3 w-full">
                  <button onClick={() => setInput("Show me my top 5 recent expenses using SQL")} className="w-full p-4 text-[10px] text-gray-400 border border-gray-800 rounded-2xl hover:border-blue-500/50 hover:bg-blue-600/5 transition-all uppercase font-black tracking-widest text-left flex items-center gap-3">
                    <TerminalIcon size={14} className="text-blue-500" /> List Top Expenses
                  </button>
                  <button onClick={() => setInput("Analyze my pulse contacts for networking potential")} className="w-full p-4 text-[10px] text-gray-400 border border-gray-800 rounded-2xl hover:border-blue-500/50 hover:bg-blue-600/5 transition-all uppercase font-black tracking-widest text-left flex items-center gap-3">
                    <Zap size={14} className="text-amber-500" /> Pulse Analysis
                  </button>
                </div>
              </div>
            )}
            {messages.map((m, idx) => (
              <div key={idx} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] p-5 rounded-3xl text-sm leading-relaxed font-medium ${
                  m.role === 'user' ? 'bg-blue-600 text-white rounded-tr-none shadow-xl shadow-blue-900/20' : 'bg-[#02040a] text-gray-100 rounded-tl-none border border-gray-800 shadow-sm'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            {chatLoading && (
              <div className="flex justify-start">
                <div className="bg-[#02040a] p-5 rounded-3xl rounded-tl-none border border-gray-800 flex flex-col gap-4 w-64">
                   <div className="flex gap-2 items-center">
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-75"></div>
                    <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-150"></div>
                    <span className="text-[10px] font-black text-gray-600 uppercase ml-2 tracking-widest">Reasoning...</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleChat} className="p-8 border-t border-gray-900 bg-gray-900/30 backdrop-blur-md">
            <div className="relative">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Query Sovereign Intelligence..."
                className="w-full bg-[#02040a] border border-gray-800 rounded-2xl px-6 py-5 pr-20 outline-none focus:ring-2 focus:ring-blue-600 transition-all text-sm font-medium placeholder-gray-700"
              />
              <button 
                type="submit"
                className="absolute right-2.5 top-2.5 p-3.5 bg-blue-600 hover:bg-blue-500 rounded-xl transition-all text-white shadow-xl shadow-blue-900/40 active:scale-95"
              >
                <Send size={22} />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default InsightsModule;
