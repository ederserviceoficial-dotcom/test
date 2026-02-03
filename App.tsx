
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, Project, ProjectSettings, HistoryItem } from './types';
import HomeView from './views/HomeView';
import EditorView from './views/EditorView';
import LensesView from './views/LensesView';
import ExportView from './views/ExportView';

const DEFAULT_SETTINGS: ProjectSettings = {
  brightness: 100,
  contrast: 100,
  exposure: 0,
  highlights: 100,
  shadows: 0,
  whites: 0,
  blacks: 0,
  saturation: 100,
  vibrance: 100,
  temperature: 0,
  tint: 0,
  hue: 0,
  sepia: 0,
  blur: 0,
  sharpness: 0,
  noiseReduction: 0,
  vignette: 0,
  dehaze: 0,
  grain: 0,
  bloom: 0,
  chromaticAberration: 0,
  clarity: 0,
  glow: 0,
  aspectRatio: 'Custom',
  rotation: 0,
  flipH: false,
  flipV: false,
  skewX: 0,
  skewY: 0,
  activeFilter: 'none',
  filterIntensity: 100,
  layers: [],
  curves: [{ x: 0, y: 0 }, { x: 1, y: 1 }],
  hsl: {
    red: { h: 0, s: 0, l: 0 },
    blue: { h: 0, s: 0, l: 0 },
    green: { h: 0, s: 0, l: 0 }
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.HOME);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('aider_studio_v14');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  // Use a ref to store current project settings to avoid stale closures in undo/redo
  const projectsRef = useRef(projects);
  useEffect(() => {
    projectsRef.current = projects;
    localStorage.setItem('aider_studio_v14', JSON.stringify(projects));
  }, [projects]);

  const activeProject = projects.find(p => p.id === activeProjectId);

  const handleCreateProject = (type: 'photo' | 'video', file?: File) => {
    const newId = Date.now().toString();
    const processCreate = (thumbnail: string, title?: string) => {
        const newProject: Project = {
          id: newId,
          title: title || `Project_${newId.slice(-4)}`,
          thumbnail: thumbnail,
          type,
          lastEdited: 'Just now',
          settings: { ...DEFAULT_SETTINGS }
        };
        setProjects([newProject, ...projects]);
        setActiveProjectId(newId);
        setCurrentView(View.EDITOR);
        
        const initHistory: HistoryItem = { id: 'init', label: 'Original', timestamp: Date.now(), settings: JSON.parse(JSON.stringify(DEFAULT_SETTINGS)) };
        setHistory([initHistory]);
        setHistoryIndex(0);
    };

    if (type === 'photo' && file) {
      const reader = new FileReader();
      reader.onload = (e) => processCreate(e.target?.result as string, file.name);
      reader.readAsDataURL(file);
    } else {
      processCreate('https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=1000&auto=format&fit=crop');
    }
  };

  const recordHistory = useCallback((settings: ProjectSettings, label: string) => {
    setHistory(prev => {
      const newStack = prev.slice(0, historyIndex + 1);
      const newItem: HistoryItem = {
        id: Date.now().toString(),
        label: label,
        timestamp: Date.now(),
        settings: JSON.parse(JSON.stringify(settings))
      };
      const updated = [...newStack, newItem].slice(-50);
      setHistoryIndex(updated.length - 1);
      return updated;
    });
  }, [historyIndex]);

  const handleUpdateSettings = useCallback((newSettings: Partial<ProjectSettings>, historyLabel?: string) => {
    if (!activeProjectId) return;
    
    setProjects(prev => {
      const activeIdx = prev.findIndex(p => p.id === activeProjectId);
      if (activeIdx === -1) return prev;
      
      const p = prev[activeIdx];
      const updatedSettings = { ...p.settings, ...newSettings };
      
      if (historyLabel) {
        recordHistory(updatedSettings, historyLabel);
      }

      const newProjects = [...prev];
      newProjects[activeIdx] = { ...p, settings: updatedSettings, lastEdited: 'Just now' };
      return newProjects;
    });
  }, [activeProjectId, recordHistory]);

  const handleUpdateProject = useCallback((updates: Partial<Project>) => {
    if (!activeProjectId) return;
    setProjects(prev => prev.map(p => {
      if (p.id === activeProjectId) {
        const updated = { ...p, ...updates, lastEdited: 'Just now' };
        // If thumbnail changes (AI processing), record current state to history
        if (updates.thumbnail) {
          recordHistory(p.settings, "AI Processing");
        }
        return updated;
      }
      return p;
    }));
  }, [activeProjectId, recordHistory]);

  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const targetIndex = historyIndex - 1;
      const targetSettings = history[targetIndex].settings;
      setHistoryIndex(targetIndex);
      setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, settings: JSON.parse(JSON.stringify(targetSettings)) } : p));
    }
  }, [activeProjectId, history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const targetIndex = historyIndex + 1;
      const targetSettings = history[targetIndex].settings;
      setHistoryIndex(targetIndex);
      setProjects(prev => prev.map(p => p.id === activeProjectId ? { ...p, settings: JSON.parse(JSON.stringify(targetSettings)) } : p));
    }
  }, [activeProjectId, history, historyIndex]);

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-[#050506]' : 'bg-[#f0f2f5]'} flex justify-center relative overflow-hidden`}>
      <div className="blob"></div>
      <div className="blob blob-2"></div>
      <div className="w-full max-w-md h-screen relative flex flex-col shadow-2xl overflow-hidden border-x border-white/5 z-10">
        {currentView === View.HOME && (
          <HomeView 
            onNavigate={setCurrentView} projects={projects} onCreate={handleCreateProject} 
            onSelect={(id) => { 
                setActiveProjectId(id); 
                setCurrentView(View.EDITOR); 
                const project = projects.find(p => p.id === id);
                if (project) {
                    setHistory([{ id: 'resume', label: 'Resumed', timestamp: Date.now(), settings: JSON.parse(JSON.stringify(project.settings)) }]);
                    setHistoryIndex(0);
                }
            }} 
            onDelete={(id) => setProjects(prev => prev.filter(p => p.id !== id))}
            onRename={(id, title) => setProjects(prev => prev.map(p => p.id === id ? { ...p, title } : p))}
            isSearchActive={isSearchActive} setIsSearchActive={setIsSearchActive} theme={theme} setTheme={setTheme}
          />
        )}
        {currentView === View.EDITOR && activeProject && (
          <EditorView 
            onNavigate={setCurrentView} 
            project={activeProject} 
            onUpdate={handleUpdateSettings} 
            onUpdateProject={handleUpdateProject}
            history={history}
            onUndo={handleUndo}
            onRedo={handleRedo}
            canUndo={historyIndex > 0}
            canRedo={historyIndex < history.length - 1}
          />
        )}
        {currentView === View.LENSES && activeProject && (
          <LensesView onNavigate={setCurrentView} settings={activeProject.settings} onUpdate={handleUpdateSettings} />
        )}
        {currentView === View.EXPORT && activeProject && (
          <ExportView onNavigate={setCurrentView} project={activeProject} onRename={(title) => setProjects(prev => prev.map(p => p.id === activeProject.id ? { ...p, title } : p))} />
        )}
      </div>
    </div>
  );
};

export default App;
