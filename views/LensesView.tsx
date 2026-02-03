
import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, SlidersHorizontal, Wand2, Sparkles, Droplets, Sun, Moon, Palette, 
  Circle, Wind, Focus, Zap, Trash2, Contrast, RotateCcw, Activity
} from 'lucide-react';
import { View, ProjectSettings, CurvePoint } from '../types';

interface LensesViewProps {
  onNavigate: (view: View) => void;
  settings: ProjectSettings;
  onUpdate: (settings: Partial<ProjectSettings>, label?: string) => void;
}

const LensesView: React.FC<LensesViewProps> = ({ onNavigate, settings, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<'basics' | 'curves' | 'hsl' | 'effects'>('basics');
  
  const filterStyle = {
    filter: `
      brightness(${settings.brightness}%) 
      saturate(${settings.saturation}%) 
      contrast(${settings.contrast}%) 
      sepia(${settings.sepia}%) 
      hue-rotate(${settings.hue}deg)
      blur(${settings.blur}px)
    `
  };

  const handleCurvesReset = () => {
    onUpdate({ curves: [{ x: 0, y: 0 }, { x: 1, y: 1 }] }, 'Reset Curves');
  };

  const presets = [
    { name: 'Cinematic Cyan', config: { hue: 180, saturation: 120, contrast: 115, sepia: 10 } },
    { name: 'Muted Gold', config: { saturation: 80, sepia: 40, contrast: 105, brightness: 105 } },
    { name: 'Kodak Portra', config: { vibrance: 110, temperature: 10, shadows: 5, whites: 5 } },
    { name: 'High Contrast BW', config: { saturation: 0, contrast: 160, blacks: -20, whites: 20 } },
  ];

  const handleSliderChange = (key: string, label: string, val: number) => {
    // Immediate preview update without history record
    onUpdate({ [key]: val }, undefined); 
  };

  const handleSliderCommit = (key: string, label: string, val: number) => {
    // Final value update with history label
    onUpdate({ [key]: val }, `Adjust ${label}`);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050506] overflow-hidden">
      <header className="px-6 h-20 flex items-center justify-between glass-header z-20">
        <button onClick={() => onNavigate(View.EDITOR)} className="p-2 text-zinc-400 hover:text-white transition-all bg-white/5 rounded-xl border border-white/5">
          <ChevronLeft size={22} strokeWidth={2.5} />
        </button>
        <div className="flex flex-col items-center">
          <h1 className="text-[11px] font-black uppercase tracking-[0.4em] text-zinc-100">Grade Master</h1>
          <span className="text-[8px] font-black text-blue-500 uppercase tracking-widest mt-0.5">16-Bit Processing</span>
        </div>
        <button onClick={() => onNavigate(View.EDITOR)} className="bg-white text-black px-6 py-2 rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl glow-white">APPLY</button>
      </header>

      <div className="flex-1 overflow-y-auto px-6 py-8 space-y-10 scrollbar-hide">
        <div className="relative aspect-square rounded-[3.5rem] overflow-hidden surface-deep border border-white/10 shadow-[0_40px_100px_rgba(0,0,0,0.6)]">
          <img 
            src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=600" 
            className="w-full h-full object-cover transition-all duration-700" 
            style={filterStyle} 
            alt="Color Grading" 
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        </div>

        <div className="flex p-1.5 glass-panel rounded-2xl border-white/5 shadow-inner">
          {[
            { id: 'basics', label: 'Tuning', icon: SlidersHorizontal },
            { id: 'curves', label: 'Curves', icon: Activity },
            { id: 'hsl', label: 'Colors', icon: Palette },
            { id: 'effects', label: 'Lens', icon: Sparkles }
          ].map(t => (
            <button 
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`flex-1 py-3.5 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${activeTab === t.id ? 'bg-white text-black glow-white shadow-xl' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              <t.icon size={12} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="pb-40">
          {activeTab === 'basics' && (
            <div className="grid gap-12 px-2">
              {[
                { label: 'Temp', key: 'temperature', min: -50, max: 50, icon: Moon, color: 'text-blue-400' },
                { label: 'Vibrance', key: 'vibrance', min: 0, max: 200, icon: Palette, color: 'text-rose-400' },
                { label: 'Brightness', key: 'brightness', min: 50, max: 150, icon: Sun, color: 'text-amber-400' },
                { label: 'Dehaze', key: 'dehaze', min: 0, max: 100, icon: Wind, color: 'text-zinc-400' },
              ].map(cfg => (
                <div key={cfg.key} className="space-y-6">
                  <div className="flex justify-between items-center text-[11px] font-black uppercase tracking-widest">
                    <span className="text-zinc-500 flex items-center gap-3"><cfg.icon size={16} className={cfg.color} /> {cfg.label}</span>
                    <span className="text-white px-3 py-1 glass-panel rounded-lg border-white/10">{(settings as any)[cfg.key]}</span>
                  </div>
                  <input 
                    type="range" 
                    min={cfg.min} 
                    max={cfg.max} 
                    value={(settings as any)[cfg.key]} 
                    onChange={(e) => handleSliderChange(cfg.key, cfg.label, parseFloat(e.target.value))}
                    onMouseUp={(e) => handleSliderCommit(cfg.key, cfg.label, parseFloat((e.target as any).value))}
                    onTouchEnd={(e) => handleSliderCommit(cfg.key, cfg.label, parseFloat((e.target as any).value))}
                    className="w-full h-1" 
                  />
                </div>
              ))}
            </div>
          )}

          {activeTab === 'curves' && (
            <div className="space-y-10 px-2">
               <div className="aspect-square glass-panel rounded-[2rem] relative border border-white/10 overflow-hidden flex items-center justify-center">
                  <svg className="w-full h-full p-8 overflow-visible" viewBox="0 0 100 100">
                     <line x1="0" y1="100" x2="100" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
                     <path d="M 0 100 Q 50 50 100 0" fill="none" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
                     <circle cx="0" cy="100" r="3" fill="white" className="cursor-pointer" />
                     <circle cx="50" cy="50" r="3" fill="white" className="cursor-pointer" />
                     <circle cx="100" cy="0" r="3" fill="white" className="cursor-pointer" />
                  </svg>
                  <div className="absolute top-4 left-4 text-[8px] font-black text-zinc-600 uppercase tracking-widest">RGB Tonal Curve</div>
               </div>
               <button onClick={handleCurvesReset} className="w-full py-4 glass-panel rounded-2xl text-[9px] font-black uppercase text-zinc-500 border-dashed">Reset Curve</button>
            </div>
          )}

          {activeTab === 'hsl' && (
             <div className="space-y-12 px-2">
                {['Hue', 'Saturation', 'Luminance'].map(mode => (
                   <div key={mode} className="space-y-6">
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{mode}</h4>
                      <div className="grid grid-cols-4 gap-4">
                         {['#ef4444', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6', '#8b5cf6', '#d946ef'].map(color => (
                            <div key={color} className="flex flex-col items-center gap-2">
                               <div className="w-10 h-10 rounded-xl shadow-lg" style={{ backgroundColor: color }}></div>
                               <input type="range" className="w-full h-1" />
                            </div>
                         ))}
                      </div>
                   </div>
                ))}
             </div>
          )}
        </div>
      </div>

      <div className="absolute bottom-32 left-0 right-0 py-6 glass-header bg-black/60 z-20">
        <h3 className="text-[9px] font-black uppercase tracking-[0.3em] text-zinc-600 px-8 mb-4">Master Presets</h3>
        <div className="flex gap-5 overflow-x-auto px-8 pb-2 scrollbar-hide">
          {presets.map(p => (
            <button key={p.name} onClick={() => onUpdate(p.config, `Applied Preset: ${p.name}`)} className="flex-shrink-0 w-28 flex flex-col gap-3 group">
              <div className="aspect-square rounded-2xl overflow-hidden border-2 border-white/10 glass-panel group-hover:border-blue-500 transition-all shadow-xl">
                <img src="https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&q=80&w=150" className="w-full h-full object-cover opacity-60" style={{ filter: `sepia(0.3) contrast(1.2)` }} alt="" />
              </div>
              <span className="text-[9px] font-black uppercase text-zinc-500 text-center tracking-widest truncate group-hover:text-blue-400">{p.name}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default LensesView;
