import { useState, useEffect, useRef } from 'react';
import { Theme, GameState, HistoryEntry, AppSaveData } from './types';
import { startGame, sendAction, resumeGame, generateSceneImage } from './lib/gemini';
import { TypewriterText } from './components/TypewriterText';
import { playBoot, playAction, playGameOver } from './lib/audio';
import { Terminal, Heart, Zap, MapPin, Package, ChevronRight, Loader2, Save, Trash2, Image as ImageIcon, ShieldAlert, Star, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  const [theme, setTheme] = useState<Theme | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [sceneImage, setSceneImage] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [inputText, setInputText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);
  const [gameError, setGameError] = useState<string | null>(null);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history, isTyping, gameState, gameError]);

  useEffect(() => {
    const savedDataStr = localStorage.getItem('infinite_rpg_save');
    if (savedDataStr) {
      setHasSavedGame(true);
    }
  }, []);

  useEffect(() => {
    if (gameState && theme && !gameError) {
      const saveData: AppSaveData = {
        theme,
        gameState,
        history,
        sceneImage
      };
      localStorage.setItem('infinite_rpg_save', JSON.stringify(saveData));
      setHasSavedGame(true);
    }
  }, [gameState, theme, history, sceneImage, gameError]);

  const fetchImage = async (description: string, currentTheme: Theme) => {
    setIsGeneratingImage(true);
    const img = await generateSceneImage(description, currentTheme);
    if (img) setSceneImage(img);
    setIsGeneratingImage(false);
  };

  const handleStart = async (selectedTheme: Theme) => {
    setGameError(null);
    playBoot();
    setTheme(selectedTheme);
    setIsLoading(true);
    try {
      const initialState = await startGame(selectedTheme);
      setGameState(initialState);
      setHistory([{
        id: Date.now().toString(),
        action: 'GAME START',
        location: initialState.location,
        text: initialState.story_text
      }]);
      setIsTyping(true);
      fetchImage(initialState.visual_description, selectedTheme);
    } catch (error) {
      console.error("Failed to start game", error);
      setGameError("Connection lost. Failed to initialize the simulation. Please try again.");
      setTheme(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleResume = async () => {
    setGameError(null);
    playBoot();
    const savedDataStr = localStorage.getItem('infinite_rpg_save');
    if (savedDataStr) {
      const savedData = JSON.parse(savedDataStr) as AppSaveData;
      setTheme(savedData.theme);
      setGameState(savedData.gameState);
      setHistory(savedData.history || []);
      setSceneImage(savedData.sceneImage || null);
      setIsLoading(true);
      try {
        await resumeGame(savedData.theme, savedData.gameState);
      } catch (error) {
        console.error("Failed to resume game", error);
        setGameError("Failed to restore saved state. The connection may have timed out.");
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to delete your save data?")) {
      localStorage.removeItem('infinite_rpg_save');
      localStorage.removeItem('infinite_rpg_state');
      localStorage.removeItem('infinite_rpg_theme');
      setHasSavedGame(false);
      setGameState(null);
      setTheme(null);
      setHistory([]);
      setSceneImage(null);
      setGameError(null);
    }
  };

  const handleAction = async (action: string) => {
    if (!action.trim() || isLoading || isTyping) return;
    setGameError(null);
    playAction();
    setIsLoading(true);
    const currentInput = action;
    setInputText('');
    try {
      const newState = await sendAction(currentInput);
      setGameState(newState);
      setHistory(prev => [...prev, {
        id: Date.now().toString(),
        action: currentInput,
        location: newState.location,
        text: newState.story_text
      }]);
      setIsTyping(true);
      if (newState.is_game_over) {
        playGameOver();
      } else {
        fetchImage(newState.visual_description, theme!);
      }
    } catch (error) {
      console.error("Failed to send action", error);
      setGameError("Transmission failed. The AI GM encountered an error or rate limit. Please try your action again.");
      setInputText(currentInput); // Restore input so they can try again
    } finally {
      setIsLoading(false);
    }
  };

  if (!theme || (!gameState && !gameError)) {
    return (
      <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center p-4 font-mono crt">
        <div className="crt-scanline-overlay"></div>
        <div className="max-w-md w-full space-y-8 relative z-10">
          <div className="text-center space-y-2">
            <Terminal className="w-16 h-16 mx-auto text-emerald-500 mb-6" />
            <h1 className="text-4xl font-bold tracking-tighter">INFINITE RPG</h1>
            <p className="text-zinc-400">Select your universe</p>
          </div>
          
          {gameError && (
            <div className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-sm flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{gameError}</p>
            </div>
          )}

          <div className="grid gap-4">
            {hasSavedGame && (
              <button
                onClick={handleResume}
                disabled={isLoading}
                className="p-5 border border-emerald-500/50 bg-emerald-500/10 rounded-lg hover:bg-emerald-500/20 transition-all text-left group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Save className="w-5 h-5 text-emerald-500" />
                    <span className="font-semibold text-lg text-emerald-400">Resume Saved Game</span>
                  </div>
                  {isLoading ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                  )}
                </div>
              </button>
            )}

            {(['Cyberpunk', 'High Fantasy', 'Space Horror'] as Theme[]).map((t) => (
              <button
                key={t}
                onClick={() => handleStart(t)}
                disabled={isLoading}
                className="p-5 border border-zinc-800 rounded-lg hover:bg-zinc-900 hover:border-emerald-500/50 transition-all text-left group relative overflow-hidden disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="relative z-10 flex items-center justify-between">
                  <span className="font-semibold text-lg">{t}</span>
                  {isLoading && theme === t ? (
                    <Loader2 className="w-5 h-5 animate-spin text-emerald-500" />
                  ) : (
                    <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity text-emerald-500" />
                  )}
                </div>
                {isLoading && theme === t && (
                  <motion.div 
                    className="absolute inset-0 bg-emerald-500/10"
                    initial={{ scaleX: 0, originX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ duration: 1, repeat: Infinity }}
                  />
                )}
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 p-4 md:p-8 font-mono flex flex-col crt">
      <div className="crt-scanline-overlay"></div>
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 relative z-10">
        
        {/* Main Terminal Area */}
        <div className="lg:col-span-2 flex flex-col border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden shadow-2xl">
          {/* Header */}
          <div className="bg-zinc-900 border-b border-zinc-800 p-4 flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2 text-emerald-500">
              <Terminal className="w-5 h-5" />
              <span className="font-semibold tracking-wider">SYS.TERMINAL // {theme.toUpperCase()}</span>
            </div>
            {gameState && (
              <div className="flex items-center gap-4 text-sm font-bold">
                <div className="flex items-center gap-1 text-emerald-400" title="Level">
                  <Star className="w-4 h-4" />
                  <span>LVL {gameState.stats.level}</span>
                </div>
                <div className="flex items-center gap-1 text-blue-400" title="XP">
                  <span>XP {gameState.stats.xp}/100</span>
                </div>
                <div className="flex items-center gap-1 text-rose-400" title="Health">
                  <Heart className="w-4 h-4" />
                  <span>{gameState.stats.health}%</span>
                </div>
                <div className="flex items-center gap-1 text-amber-400" title="Stamina">
                  <Zap className="w-4 h-4" />
                  <span>{gameState.stats.stamina}%</span>
                </div>
                <button 
                  onClick={handleReset}
                  className="ml-2 p-1.5 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/10 rounded-md transition-colors"
                  title="Reset Game"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          {/* Story Content */}
          <div ref={scrollRef} className="flex-1 p-6 overflow-y-auto space-y-8 scroll-smooth">
            {history.map((entry, index) => {
              const isLast = index === history.length - 1;
              return (
                <div key={entry.id} className="space-y-4">
                  {entry.action !== 'GAME START' && (
                    <div className="flex items-center gap-2 text-zinc-500 font-semibold">
                      <span className="text-emerald-500/50">{'>'}</span>
                      <span className="uppercase">{entry.action}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-emerald-500/80 text-sm border-b border-zinc-800/50 pb-2 font-semibold">
                    <MapPin className="w-4 h-4" />
                    <span>LOCATION: {entry.location}</span>
                  </div>
                  <div className="text-lg leading-relaxed text-zinc-300">
                    <TypewriterText 
                      text={entry.text} 
                      active={isLast && isTyping}
                      onComplete={() => isLast && setIsTyping(false)} 
                    />
                  </div>
                </div>
              );
            })}

            {gameError && (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-rose-500/10 border border-rose-500/50 rounded-lg text-rose-400 text-sm flex items-start gap-3"
              >
                <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                <div className="space-y-2">
                  <p>{gameError}</p>
                  <button 
                    onClick={() => handleAction(inputText)}
                    className="px-3 py-1.5 bg-rose-500/20 hover:bg-rose-500/30 rounded text-rose-300 transition-colors font-semibold"
                  >
                    Retry Action
                  </button>
                </div>
              </motion.div>
            )}

            {gameState?.is_game_over && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 p-6 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-400 text-center font-bold text-2xl tracking-widest relative overflow-hidden"
              >
                <div className="absolute inset-0 bg-rose-500/20 mix-blend-overlay animate-pulse"></div>
                GAME OVER
              </motion.div>
            )}
          </div>

          {/* Input Area */}
          <div className="p-4 bg-zinc-900 border-t border-zinc-800">
            <div className="space-y-4">
              <AnimatePresence>
                {!isTyping && gameState && !gameState.is_game_over && !gameError && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-wrap gap-2"
                  >
                    {gameState.suggested_actions.map((action, i) => (
                      <button
                        key={i}
                        onClick={() => handleAction(action)}
                        disabled={isLoading}
                        className="px-3 py-1.5 text-sm border border-zinc-700 rounded-md hover:bg-zinc-800 hover:border-emerald-500/50 transition-colors text-zinc-300"
                      >
                        &gt; {action}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              <form 
                onSubmit={(e) => { e.preventDefault(); handleAction(inputText); }}
                className="flex gap-2"
              >
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">
                    {'>'}
                  </span>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={isLoading || isTyping || gameState?.is_game_over}
                    placeholder="What do you do?"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-lg py-3 pl-8 pr-4 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-all disabled:opacity-50"
                  />
                </div>
                <button
                  type="submit"
                  disabled={!inputText.trim() || isLoading || isTyping || gameState?.is_game_over}
                  className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'EXECUTE'}
                </button>
              </form>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Visual Description Frame */}
          <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden shadow-xl">
            <div className="bg-zinc-900 border-b border-zinc-800 p-3 text-xs font-semibold text-zinc-500 tracking-widest flex items-center justify-between">
              <span>VISUAL_DATA_FEED</span>
              {isGeneratingImage && <Loader2 className="w-3 h-3 animate-spin text-emerald-500" />}
            </div>
            <div className="aspect-square flex items-center justify-center text-center relative overflow-hidden group bg-black">
              <div className="absolute inset-0 bg-emerald-900/10 mix-blend-overlay pointer-events-none z-20"></div>
              
              {sceneImage ? (
                <motion.img 
                  key={sceneImage}
                  initial={{ opacity: 0, filter: 'blur(10px)' }}
                  animate={{ opacity: 1, filter: 'blur(0px)' }}
                  transition={{ duration: 1 }}
                  src={sceneImage} 
                  alt="Scene" 
                  className="absolute inset-0 w-full h-full object-cover opacity-80 mix-blend-luminosity group-hover:mix-blend-normal transition-all duration-700"
                />
              ) : (
                <div className="p-6">
                  <ImageIcon className="w-8 h-8 mx-auto text-zinc-800 mb-2" />
                  <p className="text-emerald-400/50 italic text-sm relative z-10 leading-relaxed">
                    {gameState?.visual_description || "Awaiting visual data..."}
                  </p>
                </div>
              )}
              
              {/* Scanline effect */}
              <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/10 to-transparent h-10 w-full animate-scan pointer-events-none z-30"></div>
            </div>
          </div>

          {gameState && (
            <>
              {/* Status Effects */}
              {gameState.stats.status_effects && gameState.stats.status_effects.length > 0 && (
                <div className="border border-amber-500/30 rounded-xl bg-amber-500/5 overflow-hidden shadow-xl">
                  <div className="bg-amber-500/10 border-b border-amber-500/20 p-3 flex items-center gap-2 text-xs font-semibold text-amber-500 tracking-widest">
                    <ShieldAlert className="w-4 h-4" />
                    STATUS EFFECTS
                  </div>
                  <div className="p-4 flex flex-wrap gap-2">
                    {gameState.stats.status_effects.map((effect, i) => (
                      <span key={i} className="px-2 py-1 bg-amber-500/20 text-amber-400 text-xs rounded border border-amber-500/30 font-semibold">
                        {effect}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Inventory */}
              <div className="border border-zinc-800 rounded-xl bg-zinc-900/50 overflow-hidden shadow-xl">
                <div className="bg-zinc-900 border-b border-zinc-800 p-3 flex items-center gap-2 text-xs font-semibold text-zinc-500 tracking-widest">
                  <Package className="w-4 h-4" />
                  INVENTORY
                </div>
                <div className="p-4">
                  {gameState.inventory.length > 0 ? (
                    <ul className="space-y-3">
                      {gameState.inventory.map((item, i) => (
                        <li key={i} className="flex items-center gap-3 text-sm text-zinc-300">
                          <div className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-zinc-600 italic text-center py-4">Empty</p>
                  )}
                </div>
              </div>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
