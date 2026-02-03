
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Bell, Search, Sparkles, PlayCircle, Upload, HardDrive,
  MoreVertical
} from 'lucide-react';
import { View, Project } from '../types';
import Navigation from '../components/Navigation';

interface HomeViewProps {
  onNavigate: (view: View) => void;
  projects: Project[];
  onCreate: (type: 'photo' | 'video', file?: File) => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, newTitle: string) => void;
  isSearchActive: boolean;
  setIsSearchActive: (active: boolean) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const HomeView: React.FC<HomeViewProps> = ({ 
  onNavigate, projects, onCreate, onSelect, onDelete, onRename, 
  isSearchActive, setIsSearchActive, theme, setTheme 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchActive && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearchActive]);

  const filteredProjects = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return projects;
    return projects.filter(p => 
      p.title.toLowerCase().includes(query) || 
      p.type.toLowerCase().includes(query)
    );
  }, [projects, searchQuery]);

  return (
    <div className="flex flex-col h-full bg-transparent relative overflow-hidden">
      <input type="file" ref={photoInputRef} onChange={(e) => e.target.files?.[0] && onCreate('photo', e.target.files[0])} accept="image/*" className="hidden" />

      {/* Header */}
      <header className="px-6 pt-10 pb-4 flex items-center justify-between shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg">
             <span className="text-black font-black text-xl">A</span>
          </div>
          <div className="flex flex-col">
            <h1 className={`text-base font-black tracking-tight ${theme === 'dark' ? 'text-white' : 'text-black'}`}>Aider Studio</h1>
            <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest">Master Pro</span>
          </div>
        </div>
        <div className="flex gap-2">
           <button onClick={() => setIsSearchActive(!isSearchActive)} className="w-8 h-8 rounded-full flex items-center justify-center glass-panel text-zinc-500 hover:text-white transition-all"><Search size={16} /></button>
           <button onClick={() => setShowNotifications(!showNotifications)} className="w-8 h-8 rounded-full flex items-center justify-center glass-panel text-zinc-500 hover:text-white transition-all"><Bell size={16} /></button>
        </div>
      </header>

      {/* Scrollable Content Container */}
      <main className="flex-1 overflow-y-auto px-6 space-y-6 scrollbar-hide pb-32">
        {isSearchActive && (
          <div className="pb-2">
            <input 
              ref={searchInputRef}
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full glass-panel border-white/10 rounded-2xl px-5 py-4 text-xs font-bold text-white placeholder-zinc-600 outline-none"
            />
          </div>
        )}

        <section onClick={() => onCreate('video')} className="relative group cursor-pointer active:scale-[0.98] transition-all">
          <div className="relative h-44 w-full rounded-3xl overflow-hidden border border-white/10 shadow-xl">
            <img src="https://images.unsplash.com/photo-1542224566-6e85f2e6772f?auto=format&fit=crop&q=80&w=600" className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>
            <div className="absolute inset-0 p-6 flex flex-col justify-end">
              <div className="flex items-center gap-2 mb-2">
                 <div className="px-2 py-0.5 bg-blue-600 rounded text-[7px] font-black uppercase tracking-widest text-white">CINEMA</div>
                 <Sparkles size={12} className="text-blue-400" />
              </div>
              <h2 className="text-xl font-black text-white leading-tight">Create Motion</h2>
              <p className="text-[10px] text-zinc-400 font-medium">Pro sequence timeline</p>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-2 gap-3">
          <div onClick={() => photoInputRef.current?.click()} className="p-4 rounded-2xl glass-high hover:bg-white/[0.12] transition-all cursor-pointer group active:scale-95 border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-2 group-hover:bg-blue-600 transition-all"><Upload size={18} /></div>
            <h3 className="text-[11px] font-black text-white">Photo Lab</h3>
          </div>
          <div onClick={() => onCreate('video')} className="p-4 rounded-2xl glass-high hover:bg-white/[0.12] transition-all cursor-pointer group active:scale-95 border border-white/10 flex flex-col items-center justify-center text-center">
            <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center text-white mb-2 group-hover:bg-purple-600 transition-all"><PlayCircle size={18} /></div>
            <h3 className="text-[11px] font-black text-white">Video Suite</h3>
          </div>
        </div>

        <section className="space-y-4">
           <h2 className="text-[8px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-2 px-1">
             <HardDrive size={12} /> ASSETS ({filteredProjects.length})
           </h2>
           
           <div className="grid gap-3 pb-4">
              {filteredProjects.map((p) => (
                <div key={p.id} onClick={() => onSelect(p.id)} className="flex items-center gap-4 p-3 rounded-2xl glass-panel hover:bg-white/5 transition-all cursor-pointer border border-white/5 group">
                  <div className="w-14 h-14 rounded-xl overflow-hidden border border-white/10 flex-shrink-0">
                    <img src={p.thumbnail} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-black truncate text-zinc-100">{p.title}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`px-1.5 py-0.5 rounded-[4px] text-[7px] font-black uppercase tracking-widest ${p.type === 'video' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                        {p.type}
                      </span>
                      <p className="text-[8px] text-zinc-500 font-bold">{p.lastEdited}</p>
                    </div>
                  </div>
                  <MoreVertical size={14} className="text-zinc-600 group-hover:text-white" />
                </div>
              ))}
           </div>
        </section>
      </main>

      {/* FIXED Navigation: This ensures it never moves when scrolling */}
      <div className="fixed bottom-0 left-0 right-0 z-[100] w-full bg-black/80 backdrop-blur-xl border-t border-white/5 max-w-md mx-auto">
        <Navigation currentView={View.HOME} onNavigate={onNavigate} setIsSearchActive={setIsSearchActive} isSearchActive={isSearchActive} onCreate={onCreate} theme={theme} setTheme={setTheme} />
      </div>
    </div>
  );
};

export default HomeView;
