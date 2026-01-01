
import React, { useState, useMemo } from 'react';
import { 
  Plus, 
  ArrowUpRight, 
  ArrowDownRight, 
  RefreshCw, 
  Send, 
  Download, 
  Globe, 
  ShieldCheck,
  CreditCard,
  ChevronRight,
  Tag,
  Search
} from 'lucide-react';
import { WalletBalance, Transaction, CurrencyCode } from '../types';

interface WalletModuleProps {
  balances: WalletBalance[];
  transactions: Transaction[];
  categories: string[];
  onTransaction: (t: Omit<Transaction, 'id'>) => void;
  onAddCategory: (category: string) => void;
}

const WalletModule: React.FC<WalletModuleProps> = ({ balances, transactions, categories, onTransaction, onAddCategory }) => {
  const [selectedCurrency, setSelectedCurrency] = useState<CurrencyCode>('USD');
  const [isSending, setIsSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sendAmount, setSendAmount] = useState('');
  const [recipient, setRecipient] = useState('');
  const [category, setCategory] = useState('Transfer');
  const [customCategory, setCustomCategory] = useState('');

  const currentBalance = balances.find(b => b.currency === selectedCurrency) || balances[0];

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendAmount || !recipient) return;

    let finalCategory = category;
    if (category === 'CUSTOM' && customCategory.trim()) {
      finalCategory = customCategory.trim();
      onAddCategory(finalCategory);
    }
    
    onTransaction({
      amount: parseFloat(sendAmount),
      currency: selectedCurrency,
      category: finalCategory,
      type: 'expense',
      date: new Date().toISOString().split('T')[0],
      description: `Transfer to ${recipient}`,
      recipient
    });
    
    setSendAmount('');
    setRecipient('');
    setCategory('Transfer');
    setCustomCategory('');
    setIsSending(false);
  };

  const filteredTransactions = useMemo(() => {
    return transactions
      .filter(t => t.currency === selectedCurrency)
      .filter(t => 
        t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
  }, [transactions, selectedCurrency, searchTerm]);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Wallet Cards Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {balances.map((balance) => (
          <button
            key={balance.currency}
            onClick={() => setSelectedCurrency(balance.currency)}
            className={`p-6 rounded-3xl border transition-all text-left group relative overflow-hidden ${
              selectedCurrency === balance.currency
                ? 'bg-blue-600 border-blue-400 shadow-xl shadow-blue-900/20 text-white'
                : 'bg-[#0b0f1a] border-gray-800 hover:border-gray-700 text-gray-100'
            }`}
          >
            <div className="flex justify-between items-start mb-6">
              <div className={`p-2 rounded-xl ${selectedCurrency === balance.currency ? 'bg-white/20' : 'bg-blue-500/10 text-blue-400'}`}>
                {balance.currency === 'BTC' ? <RefreshCw size={20} /> : <CreditCard size={20} />}
              </div>
              <span className={`text-xs font-bold uppercase tracking-widest ${selectedCurrency === balance.currency ? 'text-blue-100' : 'text-gray-500'}`}>
                {balance.currency}
              </span>
            </div>
            <div>
              <p className={`text-xs font-medium mb-1 ${selectedCurrency === balance.currency ? 'text-blue-100' : 'text-gray-400'}`}>
                {balance.label} Balance
              </p>
              <h4 className="text-2xl font-bold">
                {balance.symbol}{balance.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </h4>
            </div>
            {selectedCurrency === balance.currency && (
              <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-white/5 rounded-full blur-2xl"></div>
            )}
          </button>
        ))}
        <button className="p-6 rounded-3xl border border-dashed border-gray-800 hover:border-blue-500/50 hover:bg-blue-500/5 transition-all text-gray-500 flex flex-col items-center justify-center gap-2 group">
          <div className="p-2 rounded-full border border-gray-800 group-hover:border-blue-500/50">
            <Plus size={20} />
          </div>
          <span className="text-sm font-semibold">Add Currency</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        {/* Active Transaction Hub */}
        <div className="xl:col-span-2 space-y-6">
          <div className="p-8 bg-gradient-to-br from-gray-900 to-[#0b0f1a] rounded-3xl border border-gray-800 shadow-2xl relative overflow-hidden">
            <div className="relative z-10">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                <div>
                  <h3 className="text-3xl font-bold mb-2 flex items-center gap-3">
                    {currentBalance.symbol}{currentBalance.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    <span className="text-sm font-normal text-gray-500 bg-gray-800 px-3 py-1 rounded-full">{currentBalance.currency}</span>
                  </h3>
                  <p className="text-gray-400 flex items-center gap-2">
                    <ShieldCheck size={16} className="text-green-500" /> Fully Encrypted & Protocol Verified
                  </p>
                </div>
                <div className="flex gap-3">
                  <button 
                    onClick={() => setIsSending(!isSending)}
                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-bold transition-all"
                  >
                    <Send size={18} /> Send
                  </button>
                  <button className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-2xl font-bold transition-all">
                    <Download size={18} /> Request
                  </button>
                </div>
              </div>

              {isSending && (
                <div className="mb-8 p-6 bg-blue-600/10 border border-blue-500/30 rounded-2xl animate-in slide-in-from-top-4 duration-300">
                  <form onSubmit={handleSend} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-blue-400 mb-2">Recipient PDS Address / DID</label>
                        <input 
                          type="text" 
                          value={recipient}
                          onChange={e => setRecipient(e.target.value)}
                          placeholder="did:plc:xyz... or name.pds"
                          className="w-full bg-gray-950 border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold uppercase text-blue-400 mb-2">Amount ({selectedCurrency})</label>
                        <input 
                          type="number" 
                          value={sendAmount}
                          onChange={e => setSendAmount(e.target.value)}
                          placeholder="0.00"
                          className="w-full bg-gray-950 border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-bold uppercase text-blue-400 mb-2">Transaction Category</label>
                        <select 
                          className="w-full bg-gray-950 border-gray-800 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                          value={category}
                          onChange={e => setCategory(e.target.value)}
                        >
                          {categories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                          <option value="CUSTOM">+ Add Custom Category</option>
                        </select>
                      </div>
                      {category === 'CUSTOM' && (
                        <div>
                          <label className="block text-xs font-bold uppercase text-blue-400 mb-2">New Category Name</label>
                          <input 
                            type="text" 
                            value={customCategory}
                            onChange={e => setCustomCategory(e.target.value)}
                            placeholder="Type name here..."
                            className="w-full bg-gray-950 border-blue-500/50 rounded-xl px-4 py-3 text-sm animate-in fade-in slide-in-from-top-1 focus:ring-2 focus:ring-blue-500 outline-none"
                            required
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                      <button type="button" onClick={() => setIsSending(false)} className="px-6 py-2 text-sm font-semibold text-gray-400 hover:text-white">Cancel</button>
                      <button type="submit" className="bg-blue-600 hover:bg-blue-500 text-white px-8 py-2 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/30">Authorize Transfer</button>
                    </div>
                  </form>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
                    <Globe size={14} className="text-blue-400" /> Network Reach
                  </div>
                  <p className="text-lg font-bold">190+ Countries</p>
                </div>
                <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
                    <RefreshCw size={14} className="text-purple-400" /> Avg. Swap Speed
                  </div>
                  <p className="text-lg font-bold">1.2 Seconds</p>
                </div>
                <div className="p-4 bg-gray-950/50 rounded-2xl border border-gray-800/50">
                  <div className="flex items-center gap-2 text-gray-500 text-xs font-bold uppercase mb-2">
                    <ShieldCheck size={14} className="text-green-400" /> Trust Score
                  </div>
                  <p className="text-lg font-bold">99.98% (A+)</p>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl -mr-32 -mt-32"></div>
          </div>

          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-2">
              <h4 className="text-lg font-bold">Recent Wallet Activity</h4>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                <input 
                  type="text"
                  placeholder="Filter activity..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="bg-[#0b0f1a] border border-gray-800 rounded-lg py-1.5 pl-9 pr-4 text-xs focus:ring-1 focus:ring-blue-500 outline-none transition-all w-full sm:w-48"
                />
              </div>
            </div>
            <div className="bg-[#0b0f1a] rounded-3xl border border-gray-800 divide-y divide-gray-800">
              {filteredTransactions.length === 0 ? (
                <div className="p-12 text-center text-gray-500 text-sm">No transactions found for this search.</div>
              ) : (
                filteredTransactions.map((t) => (
                    <div key={t.id} className="p-5 flex items-center justify-between group hover:bg-gray-900/40 transition-all first:rounded-t-3xl last:rounded-b-3xl">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                          t.type === 'income' ? 'bg-green-500/10 text-green-400' : 'bg-rose-500/10 text-rose-400'
                        }`}>
                          {t.type === 'income' ? <ArrowUpRight size={24} /> : <ArrowDownRight size={24} />}
                        </div>
                        <div>
                          <p className="font-bold text-gray-100">{t.description}</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <p className="text-xs text-gray-500 font-medium">{t.date}</p>
                            <span className="w-1 h-1 bg-gray-800 rounded-full"></span>
                            <span className="flex items-center gap-1 text-[10px] text-blue-400 font-bold uppercase tracking-wider">
                              <Tag size={10} /> {t.category}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-lg font-bold ${t.type === 'income' ? 'text-green-400' : 'text-rose-400'}`}>
                          {t.type === 'income' ? '+' : '-'}{currentBalance.symbol}{t.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </p>
                        <p className="text-[10px] font-mono text-gray-600 uppercase">TXID: {t.id.slice(-8)}</p>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        {/* Global Market & Conversion Sidebar */}
        <div className="space-y-6">
          <div className="p-6 bg-[#0b0f1a] rounded-3xl border border-gray-800">
            <h4 className="font-bold mb-4 flex items-center gap-2">
              <RefreshCw size={18} className="text-blue-400" /> Variable Fiat Rates
            </h4>
            <div className="space-y-4">
              {[
                { pair: 'USD/EUR', rate: '0.92', change: '+0.12%', up: true },
                { pair: 'USD/GBP', rate: '0.79', change: '-0.05%', up: false },
                { pair: 'USD/JPY', rate: '150.2', change: '+1.40%', up: true },
                { pair: 'USD/BTC', rate: '0.000015', change: '+3.20%', up: true }
              ].map((rate, i) => (
                <div key={i} className="flex justify-between items-center p-3 hover:bg-gray-800 rounded-xl transition-colors cursor-pointer">
                  <div>
                    <p className="text-sm font-bold">{rate.pair}</p>
                    <p className="text-xs text-gray-500">Global Spot Price</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold font-mono">{rate.rate}</p>
                    <p className={`text-[10px] font-bold ${rate.up ? 'text-green-400' : 'text-rose-400'}`}>{rate.change}</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-2xl text-xs font-bold uppercase tracking-widest transition-all">
              View All Global Pairs
            </button>
          </div>

          <div className="p-6 bg-gradient-to-br from-indigo-900/20 to-blue-900/20 rounded-3xl border border-blue-500/20">
            <h4 className="font-bold mb-2 flex items-center gap-2 text-blue-400">
              <Globe size={18} /> Protocol Merchant Network
            </h4>
            <p className="text-xs text-gray-400 mb-4 leading-relaxed">
              Your OmniPDS is accepted at over 2M merchants worldwide. Automatic fiat conversion ensures you always pay in the local currency.
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/5">
                <span className="text-xs font-medium">Virtual Card Active</span>
                <div className="w-8 h-4 bg-green-500/20 rounded-full flex items-center justify-end px-1">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                </div>
              </div>
              <button className="w-full flex items-center justify-between p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 transition-all text-xs">
                <span>Show Virtual Card Details</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WalletModule;
