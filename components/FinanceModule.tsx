
import React, { useState, useMemo } from 'react';
import { Plus, Wallet, TrendingUp, ArrowUpRight, ArrowDownRight, MoreVertical, CreditCard, Tag, Search } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Transaction, CurrencyCode } from '../types';

interface FinanceModuleProps {
  transactions: Transaction[];
  categories: string[];
  onAdd: (t: Omit<Transaction, 'id'>) => void;
  onAddCategory: (category: string) => void;
}

const FinanceModule: React.FC<FinanceModuleProps> = ({ transactions, categories, onAdd, onAddCategory }) => {
  const [showAdd, setShowAdd] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState<{
    amount: string;
    description: string;
    category: string;
    currency: CurrencyCode;
    type: 'income' | 'expense';
    customCategory: string;
  }>({ amount: '', description: '', category: 'Food', currency: 'USD', type: 'expense', customCategory: '' });

  const chartData = [
    { name: 'Mon', balance: 4200 },
    { name: 'Tue', balance: 4100 },
    { name: 'Wed', balance: 4500 },
    { name: 'Thu', balance: 4400 },
    { name: 'Fri', balance: 4800 },
    { name: 'Sat', balance: 5200 },
    { name: 'Sun', balance: 5150 },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    let finalCategory = formData.category;
    if (formData.category === 'CUSTOM' && formData.customCategory.trim()) {
      finalCategory = formData.customCategory.trim();
      onAddCategory(finalCategory);
    }

    onAdd({
      amount: parseFloat(formData.amount),
      description: formData.description,
      category: finalCategory,
      currency: formData.currency,
      type: formData.type,
      date: new Date().toISOString().split('T')[0]
    });
    setFormData({ amount: '', description: '', category: 'Food', currency: 'USD', type: 'expense', customCategory: '' });
    setShowAdd(false);
  };

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => 
      t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [transactions, searchTerm]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-8">
        {/* Balance Card */}
        <div className="p-8 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-3xl shadow-xl shadow-blue-900/20 relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-10">
              <div>
                <p className="text-blue-100 text-sm font-medium mb-1">Estimated Asset Value (USD)</p>
                <h3 className="text-4xl font-bold tracking-tight">$12,760.75</h3>
              </div>
              <CreditCard className="text-blue-200/50" size={32} />
            </div>
            <div className="flex gap-8">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg"><ArrowUpRight size={16} className="text-green-300" /></div>
                <div>
                  <p className="text-xs text-blue-100">Monthly Yield</p>
                  <p className="font-semibold">+$2,140.00</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="p-2 bg-white/10 rounded-lg"><ArrowDownRight size={16} className="text-rose-300" /></div>
                <div>
                  <p className="text-xs text-blue-100">Monthly Burn</p>
                  <p className="font-semibold">-$840.20</p>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-3xl -mr-20 -mt-20"></div>
        </div>

        {/* Chart */}
        <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800">
          <h4 className="text-lg font-semibold mb-6 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-400" /> Multi-Currency Performance
          </h4>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1f2937" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9ca3af', fontSize: 12}} dy={10} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '12px' }}
                  itemStyle={{ color: '#3b82f6' }}
                />
                <Area type="monotone" dataKey="balance" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorBalance)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold">Activity Ledger</h4>
          <button 
            onClick={() => setShowAdd(!showAdd)}
            className="p-2 bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors"
          >
            <Plus size={18} />
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#0b0f1a] border border-gray-800 rounded-xl py-2.5 pl-11 pr-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
        </div>

        {showAdd && (
          <form onSubmit={handleSubmit} className="p-6 bg-[#111827] rounded-2xl border border-blue-500/30 space-y-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="space-y-2">
              <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Transaction Details</label>
              <input 
                type="number" 
                placeholder="0.00" 
                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-lg font-mono focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: e.target.value})}
                required
              />
              <div className="flex gap-2">
                <select 
                  className="flex-1 bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.currency}
                  onChange={e => setFormData({...formData, currency: e.target.value as CurrencyCode})}
                >
                  <option value="USD">USD ($)</option>
                  <option value="EUR">EUR (€)</option>
                  <option value="GBP">GBP (£)</option>
                  <option value="JPY">JPY (¥)</option>
                </select>
                <div className="flex bg-gray-800 rounded-lg p-1 border border-gray-700">
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'income'})}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${formData.type === 'income' ? 'bg-green-600 text-white shadow-md' : 'text-gray-400'}`}
                  >
                    Income
                  </button>
                  <button 
                    type="button" 
                    onClick={() => setFormData({...formData, type: 'expense'})}
                    className={`px-3 py-1 rounded-md text-[10px] font-bold uppercase transition-all ${formData.type === 'expense' ? 'bg-rose-600 text-white shadow-md' : 'text-gray-400'}`}
                  >
                    Expense
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-2">
               <label className="text-[10px] uppercase font-bold text-gray-500 tracking-wider">Classification</label>
               <select 
                className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value})}
               >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
                <option value="CUSTOM">+ Add Custom Category</option>
               </select>

               {formData.category === 'CUSTOM' && (
                <input 
                  type="text" 
                  placeholder="New Category Name" 
                  className="w-full bg-gray-800 border-blue-500/50 rounded-lg px-4 py-2 text-sm animate-in slide-in-from-top-2 focus:ring-2 focus:ring-blue-500 outline-none"
                  value={formData.customCategory}
                  onChange={e => setFormData({...formData, customCategory: e.target.value})}
                  required
                />
               )}
            </div>

            <input 
              type="text" 
              placeholder="Memo / Description" 
              className="w-full bg-gray-800 border-gray-700 rounded-lg px-4 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
              required
            />
            
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20">
              Authorize Entry
            </button>
          </form>
        )}

        <div className="space-y-3 custom-scrollbar max-h-[500px] overflow-y-auto pr-1">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(t => (
              <div key={t.id} className="p-4 bg-[#0b0f1a] rounded-2xl border border-gray-800 flex items-center justify-between group hover:border-gray-700 transition-colors">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'}`}>
                    {t.type === 'income' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                  </div>
                  <div>
                    <p className="font-medium text-gray-100 text-sm">{t.description}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[9px] text-gray-500 uppercase font-black tracking-widest">{t.date}</span>
                      <span className="w-1 h-1 bg-gray-700 rounded-full"></span>
                      <span className="flex items-center gap-1 text-[9px] text-blue-400 font-bold uppercase tracking-wider">
                        <Tag size={10} /> {t.category}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-bold text-sm ${t.type === 'income' ? 'text-green-400' : 'text-rose-400'}`}>
                    {t.type === 'income' ? '+' : '-'}{t.amount.toFixed(2)}
                  </p>
                  <p className="text-[10px] text-gray-600 font-mono">{t.currency}</p>
                </div>
              </div>
            ))
          ) : (
            <div className="py-10 text-center text-gray-500 text-sm bg-[#0b0f1a] rounded-2xl border border-dashed border-gray-800">
              No transactions found matching your search.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinanceModule;
