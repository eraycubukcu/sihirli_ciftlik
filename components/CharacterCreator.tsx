import React, { useState, useEffect } from 'react';
import { Character } from '../types';
import { generateCharacterImage, playTTS, stopAudio } from '../services/geminiService';
import { Loader2, Sparkles, ArrowLeft, Star, Mic, Dice5, Wand2, Volume2 } from 'lucide-react';

interface CharacterCreatorProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
  onBack: () => void;
  mode?: 'default' | 'reward';
}

// Random names for kids who can't type
const CUTE_NAMES = [
  "Boncuk", "Şeker", "Bulut", "Pamuk", "Limon", 
  "Çilek", "Pofuduk", "Zeytin", "Maviş", "Güneş",
  "Fıstık", "Bambi", "Roket", "Atom", "Süper"
];

const CharacterCreator: React.FC<CharacterCreatorProps> = ({ 
  characters, 
  setCharacters, 
  onBack,
  mode = 'default' 
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);

  const isReward = mode === 'reward';

  const speak = (text: string) => {
    playTTS(text);
  };

  // Initialize Speech Recognition & Cleanup audio on unmount
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      // @ts-ignore
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.lang = 'tr-TR';
      recog.interimResults = false;

      recog.onstart = () => setIsListening(true);
      recog.onend = () => setIsListening(false);
      recog.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setDescription(prev => prev + (prev ? ' ' : '') + transcript);
      };

      setRecognition(recog);
    }
    
    // Welcome voice
    const timer = setTimeout(() => {
        if(isReward) {
            speak("Ödül kazandın! Hadi yeni bir karakter yapalım!");
        } else {
            speak("Yeni karakter yapalım! Önce ismini seç, sonra bana anlat.");
        }
    }, 500);

    return () => {
        clearTimeout(timer);
        stopAudio();
    };
  }, [isReward]);

  const toggleMic = () => {
    if (recognition) {
      if (isListening) {
        recognition.stop();
      } else {
        recognition.start();
      }
    } else {
      alert("Bu tarayıcıda sesli konuşma desteklenmiyor. Lütfen Chrome kullanın.");
    }
  };

  const pickRandomName = () => {
    const randomName = CUTE_NAMES[Math.floor(Math.random() * CUTE_NAMES.length)];
    setName(randomName);
    speak(`İsmi ${randomName} olsun mu?`);
  };

  const handleCreate = async () => {
    // Check limit only if not in reward mode
    if (!isReward && characters.length >= 3) return;
    
    // Auto-fill if empty for very small kids
    const finalName = name.trim() || CUTE_NAMES[Math.floor(Math.random() * CUTE_NAMES.length)];
    const finalDesc = description.trim() || "Sevimli, renkli, mutlu bir karakter.";

    setLoading(true);
    speak("Harika! Karakterini çiziyorum, biraz bekle...");

    try {
      const imageUrl = await generateCharacterImage(finalName, finalDesc);
      const newChar: Character = {
        id: Date.now().toString(),
        name: finalName,
        description: finalDesc,
        imageUrl
      };
      setCharacters(prev => [...prev, newChar]);
      setName('');
      setDescription('');
      
      speak("İşte karakterin hazır!");

      // If in reward mode, automatically go back to game after creation
      if (isReward) {
        setTimeout(() => {
            onBack();
        }, 1500); 
      }
    } catch (err) {
      console.error(err);
      speak("Bir hata oldu ama tekrar deneyebiliriz.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`w-full min-h-screen flex flex-col ${isReward ? 'bg-[#ffec99]' : 'bg-[#faedcd]'} font-[VT323] overflow-x-hidden`}
        style={{ backgroundImage: `radial-gradient(#e6ccb2 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
      
      {/* Header */}
      <header className="p-3 md:p-4 flex items-center justify-between z-10 sticky top-0 bg-[#faedcd]/90 backdrop-blur-sm border-b-4 border-[#d4a373]">
        <button 
          onClick={onBack}
          className="bg-[#a98467] text-[#fff] px-3 py-1 md:px-4 md:py-2 text-xl md:text-2xl border-b-4 border-[#5d4037] active:border-b-0 active:translate-y-1 hover:bg-[#c29d82] flex items-center gap-2 shadow-lg rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          {isReward ? 'Oyuna Dön' : 'Geri'}
        </button>
      </header>

      <div className="flex-1 p-4 flex flex-col items-center pb-24">
        
        {/* Title */}
        <div className="text-center mb-6 md:mb-6">
          {isReward ? (
            <div className="flex flex-col items-center">
                <div className="inline-block bg-[#f4a261] p-3 border-[4px] border-[#5d4037] mb-2 shadow-lg transform rotate-3 rounded-lg">
                    <Star className="w-8 h-8 md:w-10 md:h-10 text-[#fff]" />
                </div>
                <h1 className="text-3xl md:text-4xl text-[#e76f51] drop-shadow-md mt-2" style={{ textShadow: '2px 2px 0px #5d4037' }}>
                    Ödül Zamanı!
                </h1>
            </div>
          ) : (
            <div className="flex flex-col items-center">
                <div className="inline-block bg-[#2a9d8f] p-3 border-[4px] border-[#5d4037] mb-2 shadow-lg transform -rotate-3 rounded-lg">
                    <Wand2 className="w-8 h-8 md:w-10 md:h-10 text-[#fff]" />
                </div>
                <h1 className="text-3xl md:text-4xl text-[#264653] drop-shadow-md mt-2" style={{ textShadow: '2px 2px 0px #fff' }}>
                    Yeni Karakter
                </h1>
            </div>
          )}
        </div>

        <div className="w-full max-w-[1200px] flex flex-col lg:grid lg:grid-cols-[280px_1fr_280px] gap-6 lg:gap-8 items-start">
            
            {/* LEFT SIDE: Existing Characters (Desktop) */}
            <div className="hidden lg:flex flex-col gap-4 order-1">
                 {characters.filter((_, i) => i % 2 === 0).map(char => (
                     <div key={char.id} className="bg-[#fff8e1] p-2 border-[4px] border-[#8b4513] shadow-lg transform -rotate-1 hover:scale-105 transition-transform">
                        <div className="border-2 border-[#d7c49e] bg-white mb-2">
                            <img src={char.imageUrl} className="w-full h-32 object-cover" />
                        </div>
                        <p className="text-center text-lg text-[#5d4037]">{char.name}</p>
                     </div>
                 ))}
                 {characters.length === 0 && (
                    <div className="border-[4px] border-dashed border-[#d7c49e] h-32 flex items-center justify-center text-[#d7c49e] text-xl opacity-60 rounded-lg">
                        Boş Çerçeve
                    </div>
                 )}
            </div>

            {/* MIDDLE: Creator Panel */}
            <div className="bg-[#d4a373] p-4 md:p-6 shadow-[8px_8px_0px_rgba(93,64,55,0.4)] w-full border-[6px] border-[#5d4037] relative rounded-xl order-1 lg:order-2 max-w-3xl mx-auto">
                
                {/* Screws */}
                <div className="absolute top-3 left-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                <div className="absolute top-3 right-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                <div className="absolute bottom-3 left-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                <div className="absolute bottom-3 right-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>

                {/* Loading Overlay */}
                {loading && (
                    <div className="absolute inset-0 bg-[#fff8e1]/95 z-20 flex flex-col items-center justify-center border-4 border-[#5d4037] rounded-lg">
                        <Loader2 className="w-12 h-12 md:w-16 md:h-16 text-[#e76f51] animate-spin mb-4" />
                        <p className="text-2xl md:text-3xl text-[#5d4037] animate-pulse">Çiziliyor...</p>
                    </div>
                )}

                <div className="space-y-4 md:space-y-6">
                    
                    {/* 1. Name Section */}
                    <div className="bg-[#fff8e1] p-3 md:p-4 border-[4px] border-[#b08968] shadow-inner relative rounded-sm group">
                        <div className="flex items-center gap-2 mb-1 border-b-2 border-[#e6ccb2] pb-1">
                             <button onClick={() => speak("Karakterinin adı ne olsun? Buraya yazabilirsin veya zara basabilirsin.")} className="bg-[#5d4037] text-white p-1 rounded-full hover:scale-110 transition-transform">
                                <Volume2 className="w-4 h-4" />
                             </button>
                            <label className="block text-xl md:text-2xl text-[#5d4037]">
                                1. Adı Ne Olsun?
                            </label>
                        </div>
                        <div className="flex gap-3">
                            <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                placeholder="İsim yaz..."
                                className="flex-1 bg-transparent border-b-[3px] border-[#d7c49e] focus:border-[#e76f51] outline-none text-3xl md:text-3xl text-[#5d4037] placeholder:text-[#d7c49e] w-full min-w-0 font-bold"
                            />
                            <button 
                                onClick={pickRandomName}
                                className="bg-[#e9c46a] text-[#5d4037] p-2 border-b-[3px] border-[#5d4037] active:border-b-0 active:translate-y-1 hover:bg-[#f4a261] flex-shrink-0 rounded-lg"
                                title="Rastgele İsim"
                            >
                                <Dice5 className="w-6 h-6 md:w-8 md:h-8" />
                            </button>
                        </div>
                    </div>

                    {/* 2. Description Section (Voice) */}
                    <div className="bg-[#fff8e1] p-3 md:p-4 border-[4px] border-[#b08968] shadow-inner relative rounded-sm">
                         <div className="flex items-center gap-2 mb-1 border-b-2 border-[#e6ccb2] pb-1">
                             <button onClick={() => speak("Karakterin neye benzesin? Aşağıdaki mikrofona bas ve bana anlat.")} className="bg-[#5d4037] text-white p-1 rounded-full hover:scale-110 transition-transform">
                                <Volume2 className="w-4 h-4" />
                             </button>
                            <label className="block text-xl md:text-2xl text-[#5d4037]">
                                2. Neye Benzesin?
                            </label>
                        </div>
                        <div className="relative">
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Mikrofona bas ve anlat!"
                                className="w-full bg-transparent border-none outline-none resize-none h-24 md:h-24 text-xl md:text-xl text-[#5d4037] placeholder:text-[#d7c49e] leading-tight pb-12"
                            />
                            
                            {/* Mic Button */}
                            <button
                                onClick={toggleMic}
                                className={`absolute bottom-2 right-2 p-3 md:p-4 border-[3px] border-[#5d4037] transition-all transform hover:scale-110 rounded-full shadow-lg ${
                                    isListening 
                                    ? 'bg-[#e63946] text-white animate-pulse' 
                                    : 'bg-[#457b9d] text-white hover:bg-[#1d3557]'
                                }`}
                            >
                                <Mic className={`w-8 h-8 md:w-10 md:h-10 ${isListening ? 'animate-bounce' : ''}`} />
                            </button>
                        </div>
                        {isListening && <p className="text-center text-[#e63946] text-lg md:text-xl mt-1 animate-pulse font-bold">Dinliyorum...</p>}
                    </div>

                    {/* Create Button */}
                    <button
                        onClick={handleCreate}
                        disabled={loading || (!isReward && characters.length >= 3)}
                        className={`w-full py-3 md:py-3 border-b-[6px] md:border-b-[6px] active:border-b-0 active:translate-y-1 active:mt-1 text-2xl md:text-3xl flex items-center justify-center gap-3 transition-all rounded-xl ${
                        loading || (!isReward && characters.length >= 3)
                            ? 'bg-[#b0b0b0] border-[#808080] text-[#606060] cursor-not-allowed'
                            : isReward 
                                ? 'bg-[#e9c46a] text-[#5d4037] border-[#5d4037] hover:bg-[#f4a261]'
                                : 'bg-[#588157] text-white border-[#3a5a40] hover:bg-[#6a994e]'
                        }`}
                    >
                        {loading ? <Loader2 className="animate-spin w-5 h-5 md:w-6 md:h-6" /> : <Sparkles className="w-5 h-5 md:w-6 md:h-6 fill-current" />}
                        {loading ? 'Yapılıyor...' : 'OLUŞTUR!'}
                    </button>
                </div>
            </div>

            {/* RIGHT SIDE: Existing Characters (Desktop) */}
            <div className="hidden lg:flex flex-col gap-4 order-3">
                 {characters.filter((_, i) => i % 2 !== 0).map(char => (
                     <div key={char.id} className="bg-[#fff8e1] p-2 border-[4px] border-[#8b4513] shadow-lg transform rotate-1 hover:scale-105 transition-transform">
                        <div className="border-2 border-[#d7c49e] bg-white mb-2">
                            <img src={char.imageUrl} className="w-full h-32 object-cover" />
                        </div>
                        <p className="text-center text-lg text-[#5d4037]">{char.name}</p>
                     </div>
                 ))}
                 {characters.length < 2 && (
                    <div className="border-[4px] border-dashed border-[#d7c49e] h-32 flex items-center justify-center text-[#d7c49e] text-xl opacity-60 rounded-lg">
                        Boş Çerçeve
                    </div>
                 )}
            </div>

             {/* MOBILE/TABLET: Existing Characters (Combined List at Bottom) */}
             <div className="flex lg:hidden flex-wrap gap-4 order-3 w-full justify-center">
                {characters.map(char => (
                     <div key={char.id} className="bg-[#fff8e1] p-2 border-4 border-[#8b4513] shadow-md w-32 transform hover:scale-105 transition-transform">
                        <div className="border-2 border-[#d7c49e] bg-white mb-1">
                            <img src={char.imageUrl} className="w-full h-28 object-cover" />
                        </div>
                        <p className="text-center text-lg text-[#5d4037] truncate">{char.name}</p>
                     </div>
                ))}
            </div>

        </div>

        {/* Helper Text */}
        {!isReward && characters.length < 3 && (
            <div className="mt-6 text-[#5d4037] text-xl md:text-2xl bg-[#fff8e1] px-5 py-2 border-[3px] border-[#5d4037] shadow-lg transform rotate-1 rounded-lg">
                {3 - characters.length} hakkın kaldı!
            </div>
        )}
      </div>
    </div>
  );
};

export default CharacterCreator;