import React, { useState, useEffect, useCallback } from 'react';
import { Character } from '../types';
import { playTTS, stopAudio } from '../services/geminiService';
import { RefreshCw, ArrowLeft, Star, HelpCircle, Trophy, Lightbulb, Sparkles, Volume2 } from 'lucide-react';

interface GameBoardProps {
  characters: Character[];
  onBack: () => void;
  score: number;
  setScore: (score: number) => void;
  title: string;
  onRequestReward: () => void;
}

interface PuzzleRow {
    sequence: Character[];
    resultCode: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ characters, onBack, score, setScore, title, onRequestReward }) => {
  // Game State
  const [clueRows, setClueRows] = useState<PuzzleRow[]>([]);
  const [questionRow, setQuestionRow] = useState<PuzzleRow | null>(null);
  const [options, setOptions] = useState<string[]>([]);
  
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [streak, setStreak] = useState(0);
  const [correctCountForReward, setCorrectCountForReward] = useState(0);

  const speak = (text: string) => {
    playTTS(text);
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Initialize Level Logic
  const initLevel = useCallback(() => {
    if (characters.length < 2) return;

    const newestChar = characters[characters.length - 1];
    const poolSize = Math.min(3, characters.length);
    const otherChars = characters.filter(c => c.id !== newestChar.id);
    const shuffledOthers = otherChars.sort(() => Math.random() - 0.5).slice(0, poolSize - 1);
    const activePool = [newestChar, ...shuffledOthers].sort(() => Math.random() - 0.5);

    const availableNumbers = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
    const roundMapping = new Map<string, number>();
    
    activePool.forEach((char, index) => {
        roundMapping.set(char.id, availableNumbers[index]);
    });

    const createRow = (length: number): PuzzleRow => {
        const seq: Character[] = [];
        for(let i=0; i<length; i++) {
            seq.push(activePool[Math.floor(Math.random() * activePool.length)]);
        }
        const code = seq.map(c => roundMapping.get(c.id)).join('');
        return { sequence: seq, resultCode: code };
    };

    let row1: PuzzleRow = createRow(3); 
    let row2: PuzzleRow = createRow(3); 
    let validClues = false;
    let attempts = 0;

    while (!validClues && attempts < 200) {
        row1 = createRow(3);
        row2 = createRow(3);

        if (row1.resultCode === row2.resultCode) {
            attempts++;
            continue;
        }

        const revealedCharIds = new Set([
            ...row1.sequence.map(c => c.id),
            ...row2.sequence.map(c => c.id)
        ]);
        const allActiveRevealed = activePool.every(char => revealedCharIds.has(char.id));

        if (allActiveRevealed) {
            validClues = true;
        }
        attempts++;
    }

    if (!validClues) {
        const p = activePool;
        if (p.length >= 3) {
            const seq1 = [p[0], p[1], p[0]];
            const seq2 = [p[2], p[2], p[1]];
            row1 = { sequence: seq1, resultCode: seq1.map(c => roundMapping.get(c.id)).join('') };
            row2 = { sequence: seq2, resultCode: seq2.map(c => roundMapping.get(c.id)).join('') };
        } else {
            const seq1 = [p[0], p[1], p[0]];
            const seq2 = [p[1], p[0], p[1]];
            row1 = { sequence: seq1, resultCode: seq1.map(c => roundMapping.get(c.id)).join('') };
            row2 = { sequence: seq2, resultCode: seq2.map(c => roundMapping.get(c.id)).join('') };
        }
    }

    setClueRows([row1, row2]);

    let qRow = createRow(3);
    let qAttempts = 0;
    while ((qRow.resultCode === row1.resultCode || qRow.resultCode === row2.resultCode) && qAttempts < 50) {
        qRow = createRow(3);
        qAttempts++;
    }
    setQuestionRow(qRow);

    const correctCode = qRow.resultCode;
    const newOptions = new Set<string>();
    newOptions.add(correctCode);

    let safetyCounter = 0;
    while(newOptions.size < 4 && safetyCounter < 100) {
        const distractor = Array(3).fill(0).map(() => {
            const randomCharId = activePool[Math.floor(Math.random() * activePool.length)].id;
            return roundMapping.get(randomCharId);
        }).join('');

        if (distractor !== correctCode) {
            newOptions.add(distractor);
        }
        safetyCounter++;
    }

    setOptions(Array.from(newOptions).sort(() => Math.random() - 0.5));
    
    setSelectedAnswer(null);
    setIsCorrect(null);

  }, [characters]);

  useEffect(() => {
    initLevel();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); 

  const handleAnswer = (option: string) => {
    if (selectedAnswer !== null) return;
    
    setSelectedAnswer(option);
    const correct = option === questionRow?.resultCode;
    setIsCorrect(correct);

    if (correct) {
        setScore(score + 10 + (streak * 2));
        setStreak(s => s + 1);
        setCorrectCountForReward(prev => prev + 1);
        
        speak("Harikasın! Doğru bildin!");

        const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
        audio.volume = 0.2;
        audio.play().catch(() => {});
    } else {
        setStreak(0);
        speak("Üzgünüm, yanlış oldu. Tekrar deneyelim mi?");
        const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/clown_horn_squeeze.ogg');
        audio.volume = 0.2;
        audio.play().catch(() => {});
    }
  };

  const explainGame = () => {
    speak("Nasıl oynanır anlatıyorum. Sol taraftaki resimlere bak ve sayılarını bul. Sonra soru işaretinin yerine hangi sayı gelmeli, aşağıdan işaretle!");
  };

  // Reward available every 3 correct answers
  const isRewardAvailable = isCorrect && correctCountForReward > 0 && correctCountForReward % 3 === 0;

  return (
    <div className="w-full min-h-screen bg-[#fffae0] flex flex-col font-sans text-[#5d4037] pb-24" 
         style={{ backgroundImage: `radial-gradient(#e6ccb2 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
       
       {/* Header */}
       <header className="p-2 md:p-3 bg-[#d4a373] border-b-4 border-[#5d4037] shadow-lg flex items-center justify-between sticky top-0 z-30">
            <button 
                onClick={onBack}
                className="bg-[#fff8e1] text-[#5d4037] border-2 border-[#5d4037] hover:bg-[#ffe5b4] text-xl md:text-2xl px-3 py-1 md:px-4 shadow-[4px_4px_0px_#5d4037] active:shadow-none active:translate-x-1 active:translate-y-1 transition-all flex items-center gap-2 rounded-lg"
            >
                <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" /> 
                <span className="hidden md:inline">Menü</span>
            </button>
            
            <div className="flex items-center gap-2 md:gap-4">
                 <button 
                    onClick={explainGame}
                    className="bg-[#2a9d8f] text-white p-2 rounded-full border-2 border-[#5d4037] shadow-md hover:scale-110 transition-transform"
                    title="Nasıl Oynanır?"
                 >
                    <Volume2 className="w-6 h-6 md:w-8 md:h-8" />
                 </button>

                <div className="flex flex-col items-end mr-2 bg-[#fff8e1] px-2 md:px-4 py-1 border-2 border-[#5d4037] rounded-lg">
                    <span className="text-sm md:text-lg text-[#8b4513] hidden md:inline">Ünvan</span>
                    <span className="text-xl md:text-2xl font-bold text-[#e76f51] leading-none">{title}</span>
                </div>
                <div className="bg-[#f4a261] text-[#5d4037] px-3 py-1 md:px-4 md:py-2 text-2xl md:text-2xl shadow-[4px_4px_0px_#5d4037] border-2 border-[#5d4037] flex items-center gap-2 rounded-lg">
                    <Trophy className="w-5 h-5 md:w-6 md:h-6" />
                    {score}
                </div>
            </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 max-w-5xl mx-auto p-3 md:p-4 w-full grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-8 items-stretch mt-2 md:mt-4">
        
        {/* LEFT COLUMN: CLUES (Bulletin Board) */}
        <div className="w-full bg-[#d4a373] p-3 md:p-5 shadow-[8px_8px_0px_rgba(93,64,55,0.4)] border-[6px] border-[#5d4037] relative flex flex-col rounded-xl">
            {/* Screws */}
            <div className="absolute top-2 left-2 w-2 h-2 md:w-3 md:h-3 bg-[#5d4037] rounded-full opacity-60"></div>
            <div className="absolute top-2 right-2 w-2 h-2 md:w-3 md:h-3 bg-[#5d4037] rounded-full opacity-60"></div>

            <div className="bg-[#fff8e1] border-4 border-[#5d4037] px-4 py-1 md:px-4 md:py-2 text-2xl md:text-2xl text-[#5d4037] flex items-center gap-2 self-start mb-4 md:mb-4 transform -rotate-2 shadow-sm rounded-lg">
                <Lightbulb className="w-5 h-5 md:w-6 md:h-6" /> İPUÇLARI
            </div>
            
            <div className="flex flex-col gap-3 md:gap-4 flex-1 justify-center">
                {clueRows.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-[#faedcd] p-2 md:p-3 border-2 border-[#b08968] shadow-md relative rounded-sm">
                         {/* Pin */}
                         <div className="absolute -top-3 left-1/2 w-3 h-3 md:w-4 md:h-4 rounded-full bg-[#e63946] border border-[#5d4037] shadow-sm z-10"></div>

                        {/* Sequence */}
                        <div className="flex gap-1 md:gap-2">
                            {row.sequence.map((char, cIdx) => (
                                <div key={cIdx} className="bg-white p-0.5 md:p-1 border-2 border-[#d7c49e] shadow-sm">
                                    <img 
                                        src={char.imageUrl} 
                                        alt="char" 
                                        className="w-14 h-14 sm:w-16 sm:h-16 md:w-16 md:h-16 object-cover" 
                                    />
                                </div>
                            ))}
                        </div>
                        
                        {/* Equals */}
                        <div className="text-[#5d4037] text-2xl sm:text-3xl px-2">=</div>

                        {/* Result */}
                        <div className="bg-[#fff8e1] px-2 py-1 md:px-3 md:py-1 text-3xl sm:text-4xl text-[#5d4037] tracking-widest border-2 border-[#5d4037] shadow-inner min-w-[70px] md:min-w-[90px] text-center font-bold">
                            {row.resultCode}
                        </div>
                    </div>
                ))}
            </div>
             <p className="text-center text-[#5d4037]/70 text-lg md:text-xl mt-4 hidden md:block">Resimlerin sayısını bul!</p>
        </div>

        {/* RIGHT COLUMN: QUESTION (Chalkboard) */}
        <div className="w-full bg-[#3e4c41] p-3 md:p-5 shadow-[8px_8px_0px_rgba(93,64,55,0.4)] border-[6px] border-[#29322c] flex flex-col relative min-h-[400px] md:min-h-[450px] rounded-xl">
             
            <div className="bg-[#5d4037] text-[#fff] border-2 border-[#fff]/20 px-4 py-1 md:px-4 md:py-2 text-2xl md:text-2xl flex items-center gap-2 self-start mb-4 md:mb-4 shadow-lg rounded-lg">
                <HelpCircle className="w-5 h-5 md:w-6 md:h-6" /> SORU
            </div>

            <div className="flex-1 flex flex-col justify-center items-center mt-2 gap-4 md:gap-6">
                {/* The Question Sequence */}
                <div className="flex flex-col items-center gap-4 md:gap-6 w-full">
                     <div className="flex justify-center gap-2 md:gap-3 flex-wrap bg-[#fff]/10 p-3 md:p-4 rounded-lg border-2 border-[#fff]/20">
                        {questionRow?.sequence.map((char, i) => (
                            <div key={i} className="bg-white p-0.5 md:p-1 border-4 border-[#fff] shadow-lg transform rotate-1">
                                <img 
                                    src={char.imageUrl} 
                                    className="w-20 h-20 sm:w-24 sm:h-24 md:w-24 md:h-24 object-cover bg-white" 
                                />
                            </div>
                        ))}
                     </div>
                     <div className="flex items-center gap-2 md:gap-4">
                        <div className="text-[#fff]/80 text-4xl md:text-5xl">=</div>
                        <div className="w-24 h-20 md:w-32 md:h-24 border-4 border-dashed border-[#fff]/50 flex items-center justify-center text-5xl md:text-6xl text-[#fff]">
                            ?
                        </div>
                     </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3 md:gap-4 w-full mt-auto">
                    {options.map((option, idx) => {
                        let btnClass = "bg-[#fff8e1] text-[#5d4037] border-b-[6px] md:border-b-[6px] border-[#b08968] hover:bg-[#faedcd]";
                        if (selectedAnswer !== null) {
                            if (option === questionRow?.resultCode) {
                                btnClass = "bg-[#588157] text-white border-b-[6px] md:border-b-[6px] border-[#3a5a40]";
                            } else if (option === selectedAnswer) {
                                btnClass = "bg-[#e63946] text-white border-b-[6px] md:border-b-[6px] border-[#9d0208]";
                            } else {
                                btnClass = "bg-[#d4a373] text-[#5d4037] border-[#a98467] opacity-50";
                            }
                        }

                        return (
                            <button
                                key={idx}
                                onClick={() => handleAnswer(option)}
                                disabled={selectedAnswer !== null}
                                className={`py-3 md:py-3 text-3xl md:text-3xl active:border-b-0 active:translate-y-2 active:mt-2 transition-all shadow-xl rounded-lg ${btnClass}`}
                            >
                                {option}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Success Overlay / Next Button */}
            {selectedAnswer !== null && (
                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/60 backdrop-blur-sm rounded-lg">
                    <div className="bg-[#fff8e1] p-4 md:p-6 border-[6px] border-[#5d4037] shadow-2xl flex flex-col items-center gap-2 md:gap-4 max-w-sm w-full mx-4 rounded-xl">
                        {isCorrect ? (
                            <>
                                <Star className="w-16 h-16 md:w-16 md:h-16 text-[#e9c46a] fill-[#e9c46a] animate-bounce drop-shadow-md" />
                                <h2 className="text-4xl md:text-4xl text-[#5d4037]">HARİKA!</h2>
                                <p className="text-[#8b4513] text-xl md:text-xl">+10 Puan</p>
                                
                                <div className="w-full flex flex-col gap-2 md:gap-3 mt-2 md:mt-4">
                                    {isRewardAvailable ? (
                                        <button
                                            onClick={onRequestReward}
                                            className="w-full py-3 md:py-3 bg-[#e9c46a] text-[#5d4037] border-b-[6px] border-[#5d4037] active:border-b-0 active:translate-y-1 hover:bg-[#f4a261] flex items-center justify-center gap-2 text-xl md:text-2xl animate-pulse rounded-lg"
                                        >
                                            <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
                                            YENİ KARAKTER!
                                        </button>
                                    ) : (
                                        <button 
                                            onClick={initLevel}
                                            className="w-full py-3 md:py-3 bg-[#588157] text-white border-b-[6px] border-[#3a5a40] active:border-b-0 active:translate-y-1 hover:bg-[#6a994e] text-2xl md:text-2xl rounded-lg"
                                        >
                                            Devam Et
                                        </button>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <div className="text-5xl md:text-6xl">🙈</div>
                                <h2 className="text-3xl md:text-3xl text-[#5d4037] mt-2">Tekrar Dene!</h2>
                                <p className="text-[#8b4513] text-lg md:text-lg">Cevap: {questionRow?.resultCode}</p>
                                <button 
                                    onClick={initLevel}
                                    className="w-full py-3 md:py-3 bg-[#a98467] text-white border-b-[6px] border-[#5d4037] active:border-b-0 active:translate-y-1 hover:bg-[#c29d82] mt-2 md:mt-4 flex items-center justify-center gap-2 text-xl md:text-2xl rounded-lg"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                    Yeni Soru
                                </button>
                            </>
                        )}
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default GameBoard;