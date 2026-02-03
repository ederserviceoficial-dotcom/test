
import React, { useState, useRef } from 'react';
import { 
  ChevronLeft, Check, Film, Cpu
} from 'lucide-react';
import { View, Project } from '../types';

interface ExportViewProps {
  onNavigate: (view: View) => void;
  project: Project;
  onRename: (title: string) => void;
}

const ExportView: React.FC<ExportViewProps> = ({ onNavigate, project, onRename }) => {
  const [quality, setQuality] = useState(100);
  const [format, setFormat] = useState<'image/jpeg' | 'image/png' | 'image/webp'>('image/png');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('STUDIO ENGINE IDLE');
  const [tempTitle, setTempTitle] = useState(project.title);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const handleExport = () => {
    if (loading) return;
    setLoading(true);
    setProgress(0);
    setStatus('Initializing Studio Pipeline...');

    const runExport = async () => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = project.thumbnail;
      
      await new Promise(resolve => { img.onload = resolve; });

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d', { alpha: true });
      if (!ctx) return;

      const s = project.settings;
      canvas.width = img.width;
      canvas.height = img.height;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.save();
      
      // Apply Transforms
      ctx.translate(canvas.width / 2, canvas.height / 2);
      if (s.flipH) ctx.scale(-1, 1);
      if (s.flipV) ctx.scale(1, -1);
      if (s.rotation) ctx.rotate((s.rotation * Math.PI) / 180);
      ctx.translate(-canvas.width / 2, -canvas.height / 2);

      // Synced Filter Engine
      ctx.filter = `brightness(${s.brightness + (s.exposure || 0)}%) contrast(${s.contrast}%) saturate(${s.saturation + (s.vibrance - 100)}%) blur(${s.blur}px)`;
      ctx.drawImage(img, 0, 0);
      
      // Vignette
      if (s.vignette > 0) {
        ctx.filter = 'none';
        const dw = canvas.width;
        const dh = canvas.height;
        const grad = ctx.createRadialGradient(dw/2, dh/2, 0, dw/2, dh/2, Math.max(dw, dh)/1.1);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(1, `rgba(0,0,0,${s.vignette/100})`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, dw, dh);
      }

      // Layers
      for (const layer of s.layers) {
        if (!layer.visible) continue;
        ctx.save();
        ctx.globalAlpha = layer.opacity / 100;
        ctx.globalCompositeOperation = layer.blendMode as any;

        const lx = (layer.x / 100) * canvas.width;
        const ly = (layer.y / 100) * canvas.height;

        if (layer.type === 'text') {
          const fontScale = canvas.width / 400;
          ctx.font = `800 ${Math.round((layer.fontSize || 32) * fontScale)}px Plus Jakarta Sans`;
          ctx.fillStyle = layer.color || '#ffffff';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(layer.content, lx, ly);
        } else if (layer.type === 'image') {
          const lImg = new Image();
          lImg.src = layer.content;
          await new Promise(resolve => { lImg.onload = resolve; });
          
          const dw = canvas.width;
          const lSize = (layer.scale || 1) * (dw / 3);
          const aspect = lImg.width / lImg.height;
          const lw = lSize;
          const lh = lSize / aspect;
          
          ctx.translate(lx, ly);
          if (layer.rotation) ctx.rotate((layer.rotation * Math.PI) / 180);
          ctx.drawImage(lImg, -lw / 2, -lh / 2, lw, lh);
        }
        ctx.restore();
      }

      ctx.restore();

      const dataUrl = canvas.toDataURL(format, quality / 100);
      const link = document.createElement('a');
      link.download = `${tempTitle.split('.')[0]}_AiderPro.${format.split('/')[1]}`;
      link.href = dataUrl;
      link.click();

      setProgress(100);
      setStatus('HIGH-RES EXPORT READY');
      setLoading(false);
    };

    setTimeout(() => { setProgress(20); setStatus('Applying Neural Grades...'); }, 300);
    setTimeout(() => { setProgress(60); setStatus('Synthesizing Assets...'); }, 600);
    setTimeout(() => {
        setProgress(95);
        runExport();
    }, 900);
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050506] overflow-hidden">
      <header className="px-6 h-12 flex items-center justify-between glass-header z-50 border-b border-white/5">
        <button onClick={() => onNavigate(View.EDITOR)} className="p-1.5 text-zinc-500 hover:text-white transition-all active:scale-90">
          <ChevronLeft size={16} />
        </button>
        <h1 className="text-[9px] font-black uppercase tracking-[0.4em] text-zinc-100">Export Suite</h1>
        <div className="w-10"></div>
      </header>

      <div className="flex-1 overflow-y-auto px-8 py-10 flex flex-col gap-8 scrollbar-hide">
        <div className="p-8 rounded-[2.5rem] glass-high border-white/10 shadow-2xl space-y-6">
           <div className="flex items-center gap-6">
              <div className="w-20 h-20 bg-black rounded-2xl overflow-hidden shadow-xl border border-white/10">
                 <img src={project.thumbnail} className="w-full h-full object-cover" alt="" />
              </div>
              <div className="flex-1 min-w-0">
                 <input 
                   value={tempTitle} 
                   onChange={(e) => { setTempTitle(e.target.value); onRename(e.target.value); }} 
                   className="bg-transparent text-lg font-black text-white outline-none w-full"
                 />
                 <div className="flex gap-2 mt-2">
                   <span className="px-3 py-1 bg-blue-600/10 text-blue-400 rounded-lg text-[7px] font-black uppercase tracking-widest border border-blue-500/10">Ultra Render</span>
                 </div>
              </div>
           </div>
        </div>

        <div className="space-y-10">
           <div className="grid grid-cols-2 gap-5">
              <div className="space-y-3">
                 <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-2">MIME Format</label>
                 <select value={format} onChange={(e) => setFormat(e.target.value as any)} className="w-full glass-panel border-white/5 rounded-2xl p-4 text-[10px] font-black text-white outline-none appearance-none cursor-pointer">
                    <option value="image/png">PRO PNG (Transparent)</option>
                    <option value="image/webp">NEXT-GEN WEBP</option>
                    <option value="image/jpeg">LEGACY JPEG</option>
                 </select>
              </div>
              <div className="space-y-3">
                 <label className="text-[8px] font-black uppercase tracking-widest text-zinc-500 ml-2">Compression</label>
                 <div className="glass-panel border-white/5 rounded-2xl p-4 flex items-center justify-between">
                    <span className="text-[10px] font-black text-white uppercase">{quality}%</span>
                    <input type="range" min="50" max="100" value={quality} onChange={(e) => setQuality(parseInt(e.target.value))} className="w-16" />
                 </div>
              </div>
           </div>

           <div className="space-y-5 px-2">
              <div className="flex justify-between items-center text-[8px] font-black uppercase tracking-widest">
                 <div className="flex items-center gap-2">
                   <Cpu size={12} className={loading ? 'animate-spin text-blue-400' : 'text-zinc-500'} />
                   <span className={loading ? 'text-blue-400' : 'text-zinc-500'}>{status}</span>
                 </div>
                 <span className="text-white bg-blue-600 px-3 py-0.5 rounded-md">{progress}%</span>
              </div>
              <div className="h-4 w-full bg-white/5 rounded-full overflow-hidden p-1 border border-white/5">
                 <div className={`h-full rounded-full transition-all duration-700 ${progress === 100 ? 'bg-emerald-500' : 'bg-blue-600'}`} style={{ width: `${progress}%` }}></div>
              </div>
           </div>
        </div>

        <button 
          onClick={handleExport} 
          disabled={loading} 
          className={`mt-auto w-full h-20 rounded-[2.2rem] font-black text-[10px] tracking-[0.4em] uppercase transition-all flex items-center justify-center gap-4 shadow-2xl border border-white/10 ${loading ? 'bg-zinc-900 text-zinc-700' : 'bg-white text-black active:scale-95'}`}
        >
          {loading ? 'RENDERING...' : progress === 100 ? 'RE-RENDER' : 'SYNTHESIZE EXPORT'}
          {progress === 100 ? <Check size={20} /> : <Film size={20} />}
        </button>
      </div>
      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
};

export default ExportView;
