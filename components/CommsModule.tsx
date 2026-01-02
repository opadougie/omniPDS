
import React, { useState, useEffect } from 'react';
// Added MessageSquare to imports
import { Send, Shield, Lock, Search, MoreVertical, Paperclip, UserCircle, MessageSquare } from 'lucide-react';
import * as dbService from '../services/dbService';
import { Message, Contact } from '../types';

const CommsModule: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [input, setInput] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);

  useEffect(() => {
    setMessages(dbService.getMessages());
    setContacts(dbService.getContacts());
  }, []);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !selectedContact) return;

    const newMsg: Message = {
      id: Date.now().toString(),
      sender: 'me.pds',
      receiver: selectedContact.handle || selectedContact.name,
      text: input,
      timestamp: new Date().toISOString(),
      encrypted: true
    };

    dbService.addMessage(newMsg);
    setMessages(prev => [newMsg, ...prev]);
    setInput('');
  };

  const currentChat = messages.filter(m => 
    (m.sender === 'me.pds' && m.receiver === (selectedContact?.handle || selectedContact?.name)) ||
    (m.sender === (selectedContact?.handle || selectedContact?.name) && m.receiver === 'me.pds')
  ).reverse();

  return (
    <div className="h-[750px] bg-[#080b12] rounded-[2.5rem] border border-gray-900 flex overflow-hidden animate-in fade-in duration-500 shadow-2xl">
      {/* Sidebar */}
      <div className="w-80 border-r border-gray-900 flex flex-col">
        <div className="p-6 border-b border-gray-900">
           <h3 className="text-xl font-black mb-4">Pulse Threads</h3>
           <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600" size={14} />
              <input type="text" placeholder="Search contacts..." className="w-full bg-gray-950 border border-gray-800 rounded-xl py-2 pl-9 text-xs" />
           </div>
        </div>
        <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
           {contacts.map(c => (
             <button 
               key={c.id} 
               onClick={() => setSelectedContact(c)}
               className={`w-full flex items-center gap-3 p-3 rounded-2xl transition-all ${selectedContact?.id === c.id ? 'bg-blue-600/10 border border-blue-500/20' : 'hover:bg-gray-900 border border-transparent'}`}
             >
                <div className="w-10 h-10 rounded-xl bg-gray-800 flex items-center justify-center font-bold text-blue-400 border border-gray-700">{c.name.charAt(0)}</div>
                <div className="text-left flex-1 min-w-0">
                   <p className="font-bold text-sm truncate">{c.name}</p>
                   <p className="text-[10px] text-gray-600 truncate">{c.handle || 'No handle'}</p>
                </div>
             </button>
           ))}
           {contacts.length === 0 && (
             <div className="p-8 text-center text-gray-600 text-xs italic">No contacts registered in Pulse.</div>
           )}
        </div>
      </div>

      {/* Chat Area */}
      {selectedContact ? (
        <div className="flex-1 flex flex-col bg-gray-950/20">
          <header className="h-20 px-8 border-b border-gray-900 flex items-center justify-between">
             <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center font-bold text-blue-400">{selectedContact.name.charAt(0)}</div>
                <div>
                   <h4 className="font-bold">{selectedContact.name}</h4>
                   <div className="flex items-center gap-1.5 text-[9px] font-black text-green-500 uppercase">
                      <Shield size={10} /> Sovereign Encryption Active
                   </div>
                </div>
             </div>
             <button className="text-gray-600 hover:text-white transition-colors"><MoreVertical size={20}/></button>
          </header>

          <div className="flex-1 overflow-y-auto custom-scrollbar p-8 space-y-6">
             {currentChat.map(m => (
               <div key={m.id} className={`flex ${m.sender === 'me.pds' ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[70%] p-4 rounded-2xl text-sm ${m.sender === 'me.pds' ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-gray-900 text-gray-300 rounded-tl-none border border-gray-800'}`}>
                     <p>{m.text}</p>
                     <p className={`text-[9px] mt-2 ${m.sender === 'me.pds' ? 'text-blue-200' : 'text-gray-600'} font-mono`}>{m.timestamp.slice(11, 16)} • {m.encrypted && 'AES-256'}</p>
                  </div>
               </div>
             ))}
             {currentChat.length === 0 && (
               <div className="h-full flex flex-col items-center justify-center text-gray-700">
                  <Lock size={40} className="mb-4 opacity-10" />
                  <p className="text-sm italic">Begin a sovereign conversation.</p>
               </div>
             )}
          </div>

          <form onSubmit={handleSend} className="p-6 border-t border-gray-900 bg-gray-900/10">
             <div className="relative">
                <input 
                  type="text" value={input} onChange={e=>setInput(e.target.value)}
                  placeholder="Encrypt message to PDS node..."
                  className="w-full bg-gray-950 border border-gray-800 rounded-2xl px-6 py-4 pr-16 text-sm focus:ring-2 focus:ring-blue-600/50 outline-none transition-all"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-2">
                   <button type="button" className="p-2 text-gray-600 hover:text-blue-400"><Paperclip size={18}/></button>
                   <button type="submit" className="p-2 bg-blue-600 hover:bg-blue-500 rounded-xl text-white shadow-lg shadow-blue-900/30"><Send size={18}/></button>
                </div>
             </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-700 bg-gray-950/20">
           <MessageSquare size={64} className="mb-6 opacity-5" />
           <p className="font-bold text-sm uppercase tracking-widest opacity-20">Select a Thread to Initialise Session</p>
        </div>
      )}
    </div>
  );
};

export default CommsModule;
