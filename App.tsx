import React, { useState, useEffect } from 'react';
import { Character, AppState } from './types';
import CharacterCreator from './components/CharacterCreator';
import GameBoard from './components/GameBoard';
import CharacterPainter from './components/CharacterPainter';
import StoryMode from './components/StoryMode';
import { Play, Plus, Brush, X, Trophy, Sprout, BookOpen } from 'lucide-react';
import { playTTS, stopAudio } from './services/geminiService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.MAIN_MENU);
  const [characters, setCharacters] = useState<Character[]>([]);
  
  // Progression System
  const [score, setScore] = useState(0);
  const [title, setTitle] = useState('Çiftçi Çırağı');

  // Calculate title based on score (Stardew Titles)
  useEffect(() => {
    if (score >= 500) setTitle('👑 Kasaba Efsanesi');
    else if (score >= 300) setTitle('💎 Maden Ustası');
    else if (score >= 150) setTitle('🎃 Kabak Kralı');
    else if (score >= 80) setTitle('🐟 Usta Balıkçı');
    else if (score >= 30) setTitle('🐓 Tavukçu');
    else setTitle('🌱 Çiftçi Çırağı');
  }, [score]);

  // Welcome message on mount
  useEffect(() => {
    // Only play welcome if coming to main menu for the first time or refresh
    const timer = setTimeout(() => {
        playTTS("Sihirli Çiftliğe hoş geldin! Hadi oynamaya başla!");
    }, 1000);
    return () => {
        clearTimeout(timer);
        stopAudio();
    };
  }, []);

  const goHome = () => {
      stopAudio();
      setAppState(AppState.MAIN_MENU);
  };
  
  const goGame = () => {
      stopAudio();
      setAppState(AppState.GAME);
  };

  const removeCharacter = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setCharacters(characters.filter(c => c.id !== id));
  };

  const handlePainterComplete = (newChar: Character) => {
      setCharacters(prev => [...prev, newChar]);
      goHome();
  };

  // Wrapper to debounce or simply call playTTS
  const speak = (text: string) => {
      playTTS(text);
  };

  return (
    <div 
        className="min-h-screen w-full bg-[#fffae0] flex flex-col font-sans text-[#5d4037] relative overflow-x-hidden"
        style={{
            backgroundImage: `radial-gradient(#e6ccb2 1px, transparent 1px)`,
            backgroundSize: '20px 20px'
        }}
    >
        {/* Main Menu View */}
        {appState === AppState.MAIN_MENU && (
            <div className="flex-1 flex flex-col items-center justify-center p-4 animate-[fadeIn_0.5s_ease-out] min-h-screen">
                
                {/* Logo / Title Area */}
                <div className="text-center mb-6 relative bg-[#d4a373] p-6 md:p-6 rounded-lg border-[6px] border-[#5d4037] shadow-[8px_8px_0px_rgba(93,64,55,0.4)] w-full max-w-3xl mx-auto mt-8 md:mt-0">
                    {/* Decorative Screws */}
                    <div className="absolute top-2 left-2 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                    <div className="absolute top-2 right-2 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                    <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                    <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>

                    {/* Score Badge */}
                    {score > 0 && (
                         <div className="absolute -top-4 -right-2 md:-top-5 md:-right-5 bg-[#f4a261] text-[#5d4037] px-3 py-1 border-[4px] border-[#5d4037] shadow-lg animate-bounce-slow flex items-center gap-2 text-xl md:text-xl transform rotate-6 z-20 rounded-lg">
                            <Trophy className="w-5 h-5 md:w-5 md:h-5" /> {score}
                         </div>
                    )}
                    
                    <h1 className="text-6xl md:text-6xl font-normal text-[#5d4037] tracking-tight drop-shadow-sm mb-2 leading-none" style={{ textShadow: '2px 2px 0px #e6ccb2' }}>
                        Sihirli Çiftlik
                    </h1>
                    <div className="inline-block bg-[#fff8e1] text-[#5d4037] px-5 py-1 text-xl md:text-2xl border-2 border-[#5d4037] shadow-inner mt-1 rounded-full">
                        {title}
                    </div>
                </div>

                {/* Character Gallery on Main Menu */}
                {characters.length > 0 && (
                    <div className="w-full max-w-5xl mb-8 md:mb-8">
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-4 justify-items-center">
                            {characters.map(char => (
                                <div key={char.id} className="relative group w-full max-w-[140px]">
                                    <div className="bg-[#fff8e1] p-2 md:p-2 shadow-xl border-[4px] border-[#5d4037] flex flex-col items-center w-full transform hover:-translate-y-2 hover:rotate-1 transition-all duration-300">
                                        <div className="border-2 border-[#d7c49e] p-1 w-full bg-white mb-1">
                                            <img src={char.imageUrl} alt={char.name} className="w-full h-24 md:h-28 object-cover bg-slate-100" />
                                        </div>
                                        <span className="text-lg md:text-xl text-[#5d4037] text-center w-full truncate font-bold">{char.name}</span>
                                    </div>
                                    
                                    {/* Delete Button (Red X) */}
                                    <button 
                                        onClick={(e) => removeCharacter(e, char.id)}
                                        className="absolute -top-2 -right-2 bg-[#c1121f] text-white p-1 border-2 border-white hover:bg-red-700 transition-colors transform hover:scale-110 z-20 shadow-md rounded-full"
                                        title="Karakteri Sil"
                                    >
                                        <X className="w-3 h-3 md:w-3 md:h-3" />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Main Actions - Wood Buttons Grid - Balanced 2x2 Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-5 w-full max-w-3xl px-4 items-stretch pb-24 md:pb-16">
                    
                    {/* Character Creator Button */}
                    <button 
                        onClick={() => setAppState(AppState.CREATOR)}
                        onMouseEnter={() => speak("Karakter Yap")}
                        className="py-4 md:py-4 bg-[#8b4513] text-[#fffae0] border-b-[6px] border-[#5d4037] active:border-b-0 active:translate-y-1 active:mt-1 shadow-xl hover:bg-[#a05a2c] transition-all flex flex-col items-center justify-center gap-2 text-2xl md:text-2xl group rounded-xl"
                    >
                         {characters.length > 0 ? <Plus className="w-8 h-8 md:w-8 md:h-8" /> : <Plus className="w-10 h-10 md:w-10 md:h-10" />}
                        {characters.length > 0 ? 'Karakter Ekle' : 'Karakter Yap'}
                    </button>

                    {/* Play Button */}
                    <button 
                        onClick={() => setAppState(AppState.GAME)}
                        onMouseEnter={() => speak("Oyna")}
                        disabled={characters.length < 2} 
                        className={`py-4 md:py-4 border-b-[6px] border-[#5d4037] active:border-b-0 active:translate-y-1 active:mt-1 shadow-xl transition-all flex flex-col items-center justify-center gap-2 text-2xl md:text-2xl relative overflow-hidden rounded-xl ${
                            characters.length < 2 
                            ? 'bg-[#b0b0b0] border-[#808080] text-[#606060] cursor-not-allowed' 
                            : 'bg-[#588157] border-[#3a5a40] text-white hover:bg-[#6a994e]'
                        }`}
                    >
                        <Play className="w-10 h-10 md:w-10 md:h-10 fill-current relative z-10" />
                        <span className="relative z-10">Oyna!</span>
                    </button>

                     {/* Painting Book Button */}
                     <button 
                        onClick={() => setAppState(AppState.PAINTER)}
                        onMouseEnter={() => speak("Boyama Kitabı")}
                        className="py-4 md:py-4 bg-[#e9c46a] text-[#5d4037] border-b-[6px] border-[#b08968] active:border-b-0 active:translate-y-1 active:mt-1 shadow-xl hover:bg-[#f4a261] transition-all flex flex-col items-center justify-center gap-2 text-2xl md:text-2xl group rounded-xl"
                    >
                        <Brush className="w-8 h-8 md:w-8 md:h-8" />
                        Boyama Kitabı
                    </button>

                    {/* Story Mode Button */}
                    <button 
                        onClick={() => setAppState(AppState.STORY_MODE)}
                        onMouseEnter={() => speak("Masal Köşesi")}
                        className="py-4 md:py-4 bg-[#2a9d8f] text-[#fffae0] border-b-[6px] border-[#1d736a] active:border-b-0 active:translate-y-1 active:mt-1 shadow-xl hover:bg-[#34b6a7] transition-all flex flex-col items-center justify-center gap-2 text-2xl md:text-2xl group rounded-xl"
                    >
                        <BookOpen className="w-8 h-8 md:w-8 md:h-8" />
                        Masal Köşesi
                    </button>
                </div>
                
                {characters.length < 2 && (
                    <div className="mt-4 md:mt-6 bg-[#fff8e1] border-4 border-[#5d4037] px-6 md:px-6 py-3 md:py-3 shadow-lg flex items-center gap-4 transform -rotate-1 mb-24 mx-4 text-center rounded-full">
                        <Sprout className="w-6 h-6 md:w-6 md:h-6 text-[#588157] flex-shrink-0" />
                        <p className="text-[#5d4037] text-xl md:text-2xl">
                            Başlamak için en az 2 karakter yapmalısın!
                        </p>
                    </div>
                )}
            </div>
        )}

        {/* Character Creator View (Standard Mode) */}
        {appState === AppState.CREATOR && (
            <CharacterCreator 
                characters={characters} 
                setCharacters={setCharacters} 
                onBack={goHome}
                mode="default"
            />
        )}

        {/* Character Creator View (Reward Mode) */}
        {appState === AppState.REWARD_CREATOR && (
            <CharacterCreator 
                characters={characters} 
                setCharacters={setCharacters} 
                onBack={goGame}
                mode="reward"
            />
        )}

        {/* Painter View */}
        {appState === AppState.PAINTER && (
            <CharacterPainter onComplete={handlePainterComplete} onBack={goHome} />
        )}

        {/* Story Mode View */}
        {appState === AppState.STORY_MODE && (
            <StoryMode onBack={goHome} />
        )}

        {/* Game View */}
        {appState === AppState.GAME && (
            <GameBoard 
                characters={characters}
                onBack={goHome}
                score={score}
                setScore={setScore}
                title={title}
                onRequestReward={() => setAppState(AppState.REWARD_CREATOR)}
            />
        )}
    </div>
  );
};

export default App;