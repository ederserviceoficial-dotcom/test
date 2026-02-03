
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  ChevronLeft, SlidersHorizontal, Sparkles, Scissors, 
  RotateCcw, Maximize, Undo2, Redo2, Sun, Contrast, Droplets, Target, Wind, 
  Activity, Wand2, Scan, Image as ImageIcon, RefreshCw,
  Zap, Settings, Palette
} from 'lucide-react';
import { View, Project, ProjectSettings } from '../types';
import { GoogleGenAI, Type } from "@google/genai";

interface EditorViewProps {
  onNavigate: (view: View) => void;
  project: Project;
  onUpdate: (settings: Partial<ProjectSettings>, label?: string) => void;
  onUpdateProject?: (updates: Partial<Project>) => void;
  history: any[];
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const TOOL_GROUPS = [
  { id: 'basics', label: 'Basics', icon: SlidersHorizontal, color: '#3b82f6' },
  { id: 'ai', label: 'AI Suite', icon: Sparkles, color: '#a855f7' },
  { id: 'transform', label: 'Crop', icon: Scissors, color: '#10b981' },
  { id: 'filters', label: 'Lenses', icon: Palette, color: '#f59e0b' },
  { id: 'effects', label: 'Optics', icon: Activity, color: '#8b5cf6' }
];

const SUB_TOOLS: Record<string, any[]> = {
  basics: [
    { id: 'brightness', label: 'Brightness', min: 0, max: 200, icon: Sun },
    { id: 'contrast', label: 'Contrast', min: 0, max: 200, icon: Contrast },
    { id: 'saturation', label: 'Saturation', min: 0, max: 200, icon: Droplets },
    { id: 'exposure', label: 'Exposure', min: -100, max: 100, icon: Target },
    { id: 'temperature', label: 'Temp', min: -100, max: 100, icon: Wind }
  ],
  ai: [
    { id: 'ai_enhance', label: 'Neural Enhance', type: 'action', icon: Wand2 },
    { id: 'ai_bg_remove', label: 'Smart Isolation', type: 'action', icon: Scan }
  ],
  transform: [
    { id: 'rotate', label: 'Rotate 90', type: 'action', icon: RotateCcw },
    { id: 'flip_h', label: 'Mirror H', type: 'action', icon: Maximize },
    { id: 'flip_v', label: 'Mirror V', type: 'action', icon: Maximize }
  ],
  effects: [
    { id: 'blur', label: 'Lens Blur', min: 0, max: 50, icon: Zap },
    { id: 'vignette', label: 'Vignette', min: 0, max: 100, icon: Target }
  ]
};

const EditorView: React.FC<EditorViewProps> = ({ 
  onNavigate, project, onUpdate, onUpdateProject, onUndo, onRedo, canUndo, canRedo 
}) => {
  const [activeGroupId, setActiveGroupId] = useState<string>('basics');
  const [activeSubToolId, setActiveSubToolId] = useState<string | null>('brightness');
  const [isAiActive, setIsAiActive] = useState(false);
  const [aiStatus, setAiStatus] = useState('');
  
  const activeTools = SUB_TOOLS[activeGroupId] || [];
  const currentSubTool = activeTools.find(t => t.id === activeSubToolId);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const sourceImgRef = useRef<HTMLImageElement | null>(null);
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = project.thumbnail;
    img.onload = () => {
      sourceImgRef.current = img;
      renderEngine();
    };
    return () => { if (rafId.current) cancelAnimationFrame(rafId.current); };
  }, [project.thumbnail]);

  useEffect(() => {
    renderEngine();
  }, [project.settings, activeSubToolId]);

  const renderEngine = useCallback(() => {
    if (rafId.current) cancelAnimationFrame(rafId.current);
    
    rafId.current = requestAnimationFrame(() => {
      const canvas = canvasRef.current;
      const img = sourceImgRef.current;
      if (!canvas || !img || !containerRef.current) return;
      
      const ctx = canvas.getContext('2d', { alpha: true }); 
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const s = project.settings;
      
      const padding = 60;
      const maxWidth = containerRef.current.clientWidth - padding;
      const maxHeight = containerRef.current.clientHeight - padding;
      const scale = Math.min(maxWidth / img.width, maxHeight / img.height);
      const dw = img.width * scale;
      const dh = img.height * scale;

      if (canvas.width !== Math.floor(dw * dpr)) {
        canvas.width = Math.floor(dw * dpr);
        canvas.height = Math.floor(dh * dpr);
        canvas.style.width = `${dw}px`;
        canvas.style.height = `${dh}px`;
      }
      
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, dw, dh);
      ctx.save();
      
      ctx.translate(dw / 2, dh / 2);
      if (s.flipH) ctx.scale(-1, 1);
      if (s.flipV) ctx.scale(1, -1);
      if (s.rotation) ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.translate(-dw / 2, -dh / 2);

      ctx.filter = `brightness(${s.brightness + (s.exposure || 0)}%) contrast(${s.contrast}%) saturate(${s.saturation + (s.vibrance - 100)}%) blur(${s.blur}px)`;
      ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, dw, dh);
      
      if (s.vignette > 0) {
        ctx.filter = 'none';
        const grad = ctx.createRadialGradient(dw/2, dh/2, 0, dw/2, dh/2, Math.max(dw, dh)/1.1);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, `rgba(0,0,0,${s.vignette/100})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, dw, dh);
      }

      ctx.restore();
    });
  }, [project.settings]);

  const handleSliderInput = (val: number) => {
    if (!activeSubToolId) return;
    onUpdate({ [activeSubToolId]: val });
  };

  const handleAction = (tool: any) => {
    if (tool.id === 'ai_enhance') runAiEnhance();
    else if (tool.id === 'ai_bg_remove') runAiBgRemove();
    else if (tool.id === 'rotate') onUpdate({ rotation: (project.settings.rotation + 90) % 360 }, 'Rotate');
    else if (tool.id === 'flip_h') onUpdate({ flipH: !project.settings.flipH }, 'Mirror Horizontal');
    else if (tool.id === 'flip_v') onUpdate({ flipV: !project.settings.flipV }, 'Mirror Vertical');
  };

  const runAiEnhance = async () => {
    setIsAiActive(true);
    setAiStatus('NEURAL ANALYZER: SCANNING PIXELS...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Img = project.thumbnail.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: {
          parts: [
            { text: "Act as a pro photo editor. Scan this image. Return a JSON configuration for professional color grading using these keys: brightness (70-130), contrast (80-140), saturation (80-140), vibrance (90-130), temperature (-30 to 30), tint (-20 to 20), exposure (-20 to 20), vignette (0-40). ONLY JSON." },
            { inlineData: { data: base64Img, mimeType: 'image/jpeg' } }
          ]
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              brightness: { type: Type.NUMBER },
              contrast: { type: Type.NUMBER },
              saturation: { type: Type.NUMBER },
              vibrance: { type: Type.NUMBER },
              temperature: { type: Type.NUMBER },
              tint: { type: Type.NUMBER },
              exposure: { type: Type.NUMBER },
              vignette: { type: Type.NUMBER }
            }
          }
        }
      });
      const aiSettings = JSON.parse(response.text || '{}');
      setAiStatus('NEURAL GRADE APPLIED');
      setTimeout(() => {
        onUpdate(aiSettings, 'Neural Enhance');
        setIsAiActive(false);
      }, 800);
    } catch (e) {
      setIsAiActive(false);
    }
  };

  const runAiBgRemove = async () => {
    setIsAiActive(true);
    setAiStatus('GEMINI VISION: ISOLATING SUBJECT...');
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const base64Img = project.thumbnail.split(',')[1];
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash-image',
        contents: {
          parts: [
            { text: "Remove the background completely. Return only the subject with transparency." },
            { inlineData: { data: base64Img, mimeType: 'image/jpeg' } }
          ]
        }
      });
      for (const part of response.candidates[0].content.parts) {
        if (part.inlineData) {
          if (onUpdateProject) onUpdateProject({ thumbnail: `data:image/png;base64,${part.inlineData.data}` });
          setAiStatus('ISOLATION COMPLETE');
          break;
        }
      }
      setTimeout(() => setIsAiActive(false), 1000);
    } catch (e) {
      setIsAiActive(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050506] overflow-hidden select-none">
      {/* Header with high-end glass effect */}
      <header className="px-5 h-14 flex items-center justify-between z-[120] border-b border-white/[0.03] bg-black/40 backdrop-blur-3xl shrink-0">
        <button onClick={() => onNavigate(View.HOME)} className="p-2 text-zinc-500 hover:text-white transition-all active:scale-90 bg-white/[0.03] rounded-xl border border-white/[0.05]"><ChevronLeft size={20} /></button>
        <div className="flex flex-col items-center">
          <span className="text-[7px] font-black text-blue-500 uppercase tracking-[0.6em] mb-1 opacity-80">AIDER STUDIO PRO</span>
          <span className="text-[10px] font-black text-white uppercase tracking-widest truncate max-w-[150px]">{project.title}</span>
        </div>
        <div className="flex items-center gap-1">
           <button onClick={onUndo} disabled={!canUndo} className={`p-2 transition-colors ${canUndo ? 'text-zinc-300' : 'text-zinc-800'}`}><Undo2 size={16} /></button>
           <button onClick={onRedo} disabled={!canRedo} className={`p-2 transition-colors ${canRedo ? 'text-zinc-300' : 'text-zinc-800'}`}><Redo2 size={16} /></button>
           <button onClick={() => onNavigate(View.EXPORT)} className="bg-white text-black px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(255,255,255,0.15)] ml-2 active:scale-95 transition-all">EXPORT</button>
        </div>
      </header>

      {/* Main viewport */}
      <div ref={containerRef} className="flex-1 relative bg-[#08080a] flex items-center justify-center overflow-hidden">
        {isAiActive && (
          <div className="absolute inset-0 z-[200] bg-black/90 backdrop-blur-3xl flex items-center justify-center">
             <div className="flex flex-col items-center gap-6 animate-in fade-in zoom-in duration-500">
                <div className="relative">
                   <div className="w-20 h-20 border-2 border-blue-500/10 border-t-blue-500 rounded-full animate-spin"></div>
                   <Sparkles size={24} className="absolute inset-0 m-auto text-blue-500 animate-pulse" />
                </div>
                <h3 className="text-[10px] font-black text-white uppercase tracking-[0.4em] text-center drop-shadow-2xl">{aiStatus}</h3>
             </div>
          </div>
        )}
        <div className="relative group p-6">
          <canvas ref={canvasRef} className="shadow-[0_80px_200px_rgba(0,0,0,0.8)] rounded-sm border border-white/5 transition-transform duration-700" />
        </div>
      </div>

      {/* Aesthetic Control Panel with "Wallpaper" background */}
      <div className="h-[40vh] relative flex flex-col z-[150] shadow-[0_-30px_100px_rgba(0,0,0,1)] overflow-hidden">
        {/* Background Wallpaper Layer */}
        <div className="absolute inset-0 z-0 opacity-20 pointer-events-none panel-wallpaper"></div>
        <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black via-black/80 to-transparent"></div>
        
        {/* Content Area */}
        <div className="flex-1 flex flex-col relative z-10 px-8">
           {/* Slider / Adjust Value Area */}
           <div className="h-32 flex flex-col justify-center border-b border-white/[0.05]">
              {currentSubTool && !currentSubTool.type ? (
                <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                   <div className="flex justify-between items-center mb-6">
                      <div className="flex items-center gap-4">
                         <div className="w-12 h-12 rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center text-blue-400">
                            <currentSubTool.icon size={20} />
                         </div>
                         <div className="flex flex-col">
                            <span className="text-[11px] font-black text-white uppercase tracking-[0.2em]">{currentSubTool.label}</span>
                            <span className="text-[8px] font-bold text-zinc-500 uppercase tracking-widest mt-0.5">Adjust Intensity</span>
                         </div>
                      </div>
                      <div className="text-[14px] font-black text-blue-400 tabular-nums bg-blue-500/10 px-4 py-1 rounded-xl border border-blue-500/20">
                        {Math.round((project.settings as any)[currentSubTool.id] || 0)}
                      </div>
                   </div>
                   <input 
                     type="range" 
                     min={currentSubTool.min} 
                     max={currentSubTool.max} 
                     value={(project.settings as any)[currentSubTool.id] || 0}
                     onChange={(e) => handleSliderInput(parseFloat(e.target.value))}
                     className="w-full h-1"
                   />
                </div>
              ) : currentSubTool?.type === 'action' ? (
                <div className="flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-600">
                   <button 
                     onClick={() => handleAction(currentSubTool)} 
                     className="bg-blue-600 text-white px-10 py-3.5 rounded-full text-[10px] font-black uppercase tracking-[0.4em] flex items-center gap-4 active:scale-95 transition-all shadow-[0_20px_60px_rgba(59,130,246,0.3)] border border-blue-400/30"
                   >
                     <RefreshCw size={14} className={isAiActive ? 'animate-spin' : ''} /> 
                     {isAiActive ? 'PROCESSING...' : `INITIATE ${currentSubTool.label}`}
                   </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full opacity-40">
                   <Settings size={32} className="text-zinc-600 mb-2" />
                   <span className="text-[9px] font-black uppercase tracking-[0.3em]">Select a tool below</span>
                </div>
              )}
           </div>

           {/* Sub-Tools Row */}
           <div className="h-20 flex items-center gap-4 overflow-x-auto scrollbar-hide py-4 border-b border-white/[0.05]">
              {activeTools.map(tool => (
                <button
                  key={tool.id}
                  onClick={() => setActiveSubToolId(tool.id)}
                  className={`flex-shrink-0 min-w-[120px] h-11 flex items-center gap-3 px-4 rounded-xl transition-all duration-300 ${activeSubToolId === tool.id ? 'bg-white text-black shadow-2xl' : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03] border border-transparent hover:border-white/[0.05]'}`}
                >
                  <tool.icon size={14} className={activeSubToolId === tool.id ? 'text-black' : 'text-zinc-500'} />
                  <span className="text-[9px] font-black uppercase tracking-[0.1em]">{tool.label}</span>
                </button>
              ))}
           </div>

           {/* Main Tool Categories (Cards) */}
           <div className="flex-1 flex items-center gap-4 overflow-x-auto scrollbar-hide py-6 safe-area-bottom">
              {TOOL_GROUPS.map(group => (
                <button
                  key={group.id}
                  onClick={() => {
                    setActiveGroupId(group.id);
                    setActiveSubToolId(SUB_TOOLS[group.id]?.[0]?.id || null);
                  }}
                  className={`flex-shrink-0 flex flex-col items-center gap-3 px-6 py-4 rounded-[2.5rem] transition-all duration-500 border-2 ${activeGroupId === group.id ? 'bg-white border-white scale-105 shadow-[0_20px_50px_rgba(255,255,255,0.15)]' : 'bg-transparent border-white/[0.03] hover:bg-white/[0.03] hover:translate-y-[-2px]'}`}
                >
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all ${activeGroupId === group.id ? 'bg-blue-600 text-white rotate-[10deg] shadow-lg' : 'bg-white/[0.03] text-zinc-500'}`}>
                     <group.icon size={20} />
                  </div>
                  <span className={`text-[9px] font-black uppercase tracking-[0.2em] whitespace-nowrap ${activeGroupId === group.id ? 'text-black' : 'text-zinc-500'}`}>
                    {group.label}
                  </span>
                </button>
              ))}
           </div>
        </div>
      </div>

      <style>{`
        .panel-wallpaper {
          background-image: url('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop');
          background-size: cover;
          background-position: center;
          filter: grayscale(1) contrast(1.2) brightness(0.5);
        }
        
        input[type=range] {
          background: rgba(255, 255, 255, 0.05);
          height: 3px;
          border-radius: 10px;
        }
        
        input[type=range]::-webkit-slider-thumb {
          width: 20px;
          height: 20px;
          background: #ffffff;
          border: 4px solid #3b82f6;
          box-shadow: 0 0 20px rgba(59, 130, 246, 0.5);
        }

        /* Glassmorphism details */
        .glass-header {
          border-bottom: 0.5px solid rgba(255, 255, 255, 0.08);
        }
      `}</style>
    </div>
  );
};

export default EditorView;
