
import React, { useState, useMemo } from 'react';
import { Plus, CheckCircle2, Circle, Clock, MoreVertical, LayoutList, CheckSquare, ArrowUpDown, ChevronDown } from 'lucide-react';
import { ProjectTask } from '../types';

interface ProjectModuleProps {
  tasks: ProjectTask[];
  onAdd: (title: string, priority: ProjectTask['priority']) => void;
  onToggle: (id: string) => void;
}

type SortCriterion = 'newest' | 'priority';

const ProjectModule: React.FC<ProjectModuleProps> = ({ tasks, onAdd, onToggle }) => {
  const [newTask, setNewTask] = useState('');
  const [newPriority, setNewPriority] = useState<ProjectTask['priority']>('medium');
  const [sortBy, setSortBy] = useState<SortCriterion>('newest');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTask.trim()) {
      onAdd(newTask, newPriority);
      setNewTask('');
      setNewPriority('medium');
    }
  };

  const priorityWeight = {
    high: 3,
    medium: 2,
    low: 1
  };

  const sortedTasks = useMemo(() => {
    const list = [...tasks];
    if (sortBy === 'priority') {
      return list.sort((a, b) => priorityWeight[b.priority] - priorityWeight[a.priority]);
    }
    // Default: newest first (assuming IDs are timestamp-based or similar, 
    // but typically tasks would have a createdAt. Since we don't, 
    // we just use current list order which is prepended in App.tsx)
    return list;
  }, [tasks, sortBy]);

  const activeTasks = sortedTasks.filter(t => t.status !== 'done');
  const completedTasks = sortedTasks.filter(t => t.status === 'done');

  const priorityColors = {
    high: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    low: 'bg-blue-500/10 text-blue-400 border-blue-500/20'
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center bg-[#0b0f1a] p-6 rounded-3xl border border-gray-800 gap-4">
        <div>
          <h3 className="text-2xl font-bold mb-1">Active Projects</h3>
          <p className="text-gray-400 text-sm">You have {activeTasks.length} pending operations in your workspace.</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-gray-900 rounded-xl px-3 py-1.5 border border-gray-800">
            <span className="text-[10px] uppercase font-bold text-gray-500">Sort by</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortCriterion)}
              className="bg-transparent text-sm font-semibold focus:outline-none cursor-pointer text-blue-400"
            >
              <option value="newest">Newest</option>
              <option value="priority">Priority</option>
            </select>
          </div>
          <div className="flex gap-4">
            <div className="text-center">
              <p className="text-xl font-bold">{tasks.length}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Total</p>
            </div>
            <div className="w-px h-8 bg-gray-800"></div>
            <div className="text-center">
              <p className="text-xl font-bold text-green-400">{completedTasks.length}</p>
              <p className="text-[10px] text-gray-500 uppercase font-bold tracking-widest">Done</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#0b0f1a] border border-gray-800 rounded-3xl p-2 shadow-2xl">
        <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="New milestone for your PDS infrastructure..."
            className="flex-1 bg-transparent rounded-2xl px-6 py-4 focus:outline-none transition-all placeholder-gray-600"
          />
          <div className="flex items-center gap-2 px-2 pb-2 sm:pb-0">
            <div className="flex bg-gray-900/50 rounded-xl p-1 border border-gray-800/50">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setNewPriority(p)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase transition-all ${
                    newPriority === p 
                      ? p === 'high' ? 'bg-rose-500 text-white' : p === 'medium' ? 'bg-amber-500 text-white' : 'bg-blue-500 text-white'
                      : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
            <button 
              type="submit"
              disabled={!newTask.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white px-6 py-3 rounded-xl font-bold transition-all shadow-lg shadow-blue-900/20"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-semibold text-gray-400 mb-2 px-2">
            <Clock size={16} /> Current Focus
          </h4>
          {activeTasks.map(t => (
            <div key={t.id} className="p-4 bg-[#0b0f1a] border border-gray-800 rounded-2xl flex items-center justify-between group hover:border-gray-700 hover:bg-gray-900/40 transition-all shadow-sm">
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => onToggle(t.id)}
                  className="text-gray-600 hover:text-blue-400 transition-colors"
                >
                  <Circle size={22} />
                </button>
                <div>
                  <p className="font-medium text-gray-100">{t.title}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-[9px] font-black uppercase tracking-[0.1em] px-2 py-0.5 rounded-md border ${priorityColors[t.priority]}`}>
                      {t.priority}
                    </span>
                  </div>
                </div>
              </div>
              <button className="text-gray-600 opacity-0 group-hover:opacity-100 transition-opacity p-2 hover:bg-gray-800 rounded-lg">
                <MoreVertical size={18} />
              </button>
            </div>
          ))}
          {activeTasks.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-800/50 rounded-2xl">
              <p className="text-gray-500 text-sm">Workspace clear. Add a new task above.</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <h4 className="flex items-center gap-2 font-semibold text-gray-400 mb-2 px-2">
            <CheckCircle2 size={16} /> Completed
          </h4>
          {completedTasks.map(t => (
            <div key={t.id} className="p-4 bg-[#0b0f1a]/40 border border-gray-800/50 rounded-2xl flex items-center justify-between group">
              <div className="flex items-center gap-4 opacity-40">
                <button onClick={() => onToggle(t.id)} className="text-green-500">
                  <CheckSquare size={22} />
                </button>
                <div>
                  <p className="font-medium line-through">{t.title}</p>
                  <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                    {t.priority}
                  </span>
                </div>
              </div>
            </div>
          ))}
          {completedTasks.length === 0 && (
            <div className="text-center py-12 border-2 border-dashed border-gray-800/30 rounded-2xl">
              <p className="text-gray-500 text-sm">No tasks completed yet. Keep pushing!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProjectModule;
