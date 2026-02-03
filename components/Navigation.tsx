
import React, { useState, useRef } from 'react';
import { 
  Home, Search, Plus, User, X, Layout, ChevronLeft,
  Moon, Sun, Video, Upload, CheckCircle2, Check
} from 'lucide-react';
import { View } from '../types';

interface NavigationProps {
  currentView: View;
  onNavigate: (view: View) => void;
  setIsSearchActive: (active: boolean) => void;
  isSearchActive: boolean;
  onCreate: (type: 'photo' | 'video', file?: File) => void;
  theme: 'dark' | 'light';
  setTheme: (theme: 'dark' | 'light') => void;
}

const Navigation: React.FC<NavigationProps> = ({ 
  currentView, onNavigate, setIsSearchActive, isSearchActive, onCreate, theme, setTheme 
}) => {
  const [showProfile, setShowProfile] = useState(false);
  const [showCreateChoice, setShowCreateChoice] = useState(false);
  const navPhotoInputRef = useRef<HTMLInputElement>(null);

  const handleNavPhotoFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onCreate('photo', file);
      setShowCreateChoice(false);
    }
  };

  return (
    <>
      <input type="file" ref={navPhotoInputRef} onChange={handleNavPhotoFile} accept="image/*" className="hidden" />

      {/* Stable Flex Navigation */}
      <div className="h-20 bg-black/80 backdrop-blur-3xl border-t border-white/5 flex items-center justify-around px-8 safe-area-bottom shrink-0 z-[100] shadow-2xl relative">
        <button onClick={() => onNavigate(View.HOME)} className={`p-2 transition-all ${currentView === View.HOME ? 'text-blue-500' : 'text-zinc-500'}`}>
          <Home size={20} strokeWidth={2.5} />
        </button>
        <button onClick={() => setIsSearchActive(!isSearchActive)} className={`p-2 transition-all ${isSearchActive ? 'text-blue-500' : 'text-zinc-500'}`}>
          <Search size={20} strokeWidth={2.5} />
        </button>

        <div className="relative -mt-10">
           <button onClick={() => setShowCreateChoice(true)} className="bg-blue-600 w-12 h-12 rounded-xl shadow-lg shadow-blue-600/20 active:scale-90 transition-all flex items-center justify-center border-2 border-black">
             <Plus size={24} className="text-white" strokeWidth={3} />
           </button>
        </div>

        <button className="p-2 text-zinc-500"><Layout size={20} /></button>
        <button onClick={() => setShowProfile(true)} className={`p-2 transition-all ${showProfile ? 'text-blue-500' : 'text-zinc-500'}`}>
          <User size={20} />
        </button>
      </div>

      {/* Overlays remain fixed */}
      {showCreateChoice && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center px-8">
           <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCreateChoice(false)}></div>
           <div className="relative w-full max-w-xs glass-high rounded-3xl p-6 space-y-6 border border-white/10 shadow-2xl">
              <div className="flex justify-between items-center">
                 <h2 className="text-xs font-black uppercase tracking-widest text-white">Create</h2>
                 <button onClick={() => setShowCreateChoice(false)} className="p-1.5 text-zinc-400 bg-white/5 rounded-full"><X size={14} /></button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                 <button onClick={() => navPhotoInputRef.current?.click()} className="flex flex-col items-center gap-3 p-4 rounded-2xl glass-panel hover:bg-blue-600 transition-all">
                    <Upload size={20} className="text-blue-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Photo</span>
                 </button>
                 <button onClick={() => { onCreate('video'); setShowCreateChoice(false); }} className="flex flex-col items-center gap-3 p-4 rounded-2xl glass-panel hover:bg-purple-600 transition-all">
                    <Video size={20} className="text-purple-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-zinc-300">Video</span>
                 </button>
              </div>
           </div>
        </div>
      )}

      {showProfile && (
        <div className="fixed inset-0 z-[250] flex items-end justify-center">
           <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowProfile(false)}></div>
           <div className="relative w-full h-[75vh] panel-wallpaper border-t border-white/10 rounded-t-[2.5rem] flex flex-col overflow-hidden">
              <div className="px-8 h-16 flex items-center justify-between border-b border-white/5">
                 <button onClick={() => setShowProfile(false)} className="p-2 bg-white/5 text-zinc-400 rounded-lg"><ChevronLeft size={18} /></button>
                 <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-200">Settings</h2>
                 <div className="w-8"></div>
              </div>
              <div className="flex-1 overflow-y-auto px-8 py-8 space-y-8 scrollbar-hide">
                 <div className="flex flex-col items-center gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white text-xl font-black border-2 border-black shadow-xl">P</div>
                    <div className="text-center">
                       <p className="text-sm font-black text-white">Pro Creator</p>
                       <p className="text-[8px] font-black text-blue-500 uppercase tracking-widest flex items-center justify-center gap-1 mt-1"><CheckCircle2 size={8} /> Active Plan</p>
                    </div>
                 </div>
                 <div className="space-y-3">
                    <button onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} className="w-full p-4 rounded-2xl glass-panel flex items-center justify-between border border-white/5">
                       <span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Theme: {theme}</span>
                       <div className={`w-10 h-5 rounded-full p-1 transition-colors ${theme === 'dark' ? 'bg-blue-600' : 'bg-zinc-700'}`}>
                          <div className={`w-3 h-3 rounded-full bg-white transition-transform ${theme === 'dark' ? 'translate-x-5' : 'translate-x-0'}`}></div>
                       </div>
                    </button>
                    <button className="w-full p-4 rounded-2xl glass-panel text-left border border-white/5"><span className="text-[10px] font-black uppercase tracking-widest text-zinc-300">Security</span></button>
                    <button className="w-full p-4 rounded-2xl glass-panel text-left border border-white/5 text-red-500"><span className="text-[10px] font-black uppercase tracking-widest">Logout</span></button>
                 </div>
                 <button onClick={() => setShowProfile(false)} className="w-full h-14 bg-white text-black rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest active:scale-95 transition-all"><Check size={16} /> DONE</button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default Navigation;
