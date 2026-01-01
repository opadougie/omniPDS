
import React, { useState } from 'react';
import { Send, Heart, MessageCircle, Repeat2, MoreHorizontal } from 'lucide-react';
import { SocialPost } from '../types';

interface SocialModuleProps {
  posts: SocialPost[];
  onAddPost: (text: string) => void;
}

const SocialModule: React.FC<SocialModuleProps> = ({ posts, onAddPost }) => {
  const [newPost, setNewPost] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPost.trim()) {
      onAddPost(newPost);
      setNewPost('');
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <form onSubmit={handleSubmit} className="mb-8 p-6 bg-[#0b0f1a] rounded-2xl border border-gray-800 shadow-xl">
        <div className="flex gap-4">
          <img src="https://picsum.photos/seed/user123/40/40" className="w-12 h-12 rounded-full" alt="Avatar" />
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder="What's happening in your decentralized world?"
              className="w-full bg-transparent border-none focus:ring-0 text-lg resize-none placeholder-gray-600"
              rows={3}
            />
            <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-800">
              <div className="flex gap-4 text-gray-500">
                <button type="button" className="hover:text-blue-400 transition-colors">Image</button>
                <button type="button" className="hover:text-blue-400 transition-colors">Poll</button>
              </div>
              <button 
                type="submit"
                className="bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-full font-semibold transition-colors flex items-center gap-2"
              >
                Post <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      </form>

      <div className="space-y-4">
        {posts.map((post) => (
          <div key={post.id} className="p-6 bg-[#0b0f1a] rounded-2xl border border-gray-800 hover:border-gray-700 transition-all group">
            <div className="flex gap-4">
              <img src={`https://picsum.photos/seed/${post.author}/40/40`} className="w-12 h-12 rounded-full" alt="Author" />
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold hover:underline cursor-pointer">{post.author}</span>
                    <span className="text-gray-500 text-sm">· 2h</span>
                  </div>
                  <button className="text-gray-600 hover:text-gray-300"><MoreHorizontal size={18} /></button>
                </div>
                <p className="text-gray-200 leading-relaxed mb-4">{post.text}</p>
                <div className="flex items-center justify-between max-w-sm text-gray-500">
                  <button className="flex items-center gap-2 hover:text-blue-400 transition-colors group">
                    <div className="p-2 rounded-full group-hover:bg-blue-900/20"><MessageCircle size={18} /></div>
                    <span className="text-xs">2</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-green-400 transition-colors group">
                    <div className="p-2 rounded-full group-hover:bg-green-900/20"><Repeat2 size={18} /></div>
                    <span className="text-xs">5</span>
                  </button>
                  <button className="flex items-center gap-2 hover:text-rose-400 transition-colors group">
                    <div className="p-2 rounded-full group-hover:bg-rose-900/20"><Heart size={18} /></div>
                    <span className="text-xs">{post.likes}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SocialModule;
