import React, { useState, useEffect, useRef } from 'react';
import { generatePuzzleImage } from '../services/geminiService';
import { ArrowLeft, RefreshCw, Check, Puzzle, Loader2, Sparkles, HelpCircle } from 'lucide-react';

interface JigsawPuzzleProps {
  onBack: () => void;
}

interface PuzzlePiece {
  id: number; // 0-8, representing correct index
  currentSlot: number | null; // 0-8 if on board, null if in bank
  src: string; // Data URL of the slice
}

const JigsawPuzzle: React.FC<JigsawPuzzleProps> = ({ onBack }) => {
  const [targetImage, setTargetImage] = useState<string | null>(null);
  const [pieces, setPieces] = useState<PuzzlePiece[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPieceId, setSelectedPieceId] = useState<number | null>(null);
  const [isSolved, setIsSolved] = useState(false);

  // Helper for TTS
  const speak = (text: string) => {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'tr-TR';
    u.rate = 0.9;
    u.pitch = 1.1;
    const voices = window.speechSynthesis.getVoices();
    const trVoice = voices.find(v => 
        v.lang.startsWith('tr') && 
        (v.name.includes('Yelda') || v.name.includes('Emel') || v.name.includes('Google') || v.name.includes('Female'))
    ) || voices.find(v => v.lang.startsWith('tr'));
    if (trVoice) u.voice = trVoice;
    window.speechSynthesis.speak(u);
  };

  const startNewPuzzle = async () => {
    setLoading(true);
    setIsSolved(false);
    setPieces([]);
    setSelectedPieceId(null);
    speak("Yeni bir resim çiziyorum, bekle...");

    try {
      const imageUrl = await generatePuzzleImage();
      setTargetImage(imageUrl);
      
      // Slice Image
      const img = new Image();
      img.src = imageUrl;
      img.onload = () => {
        const pieceSize = img.width / 3;
        const newPieces: PuzzlePiece[] = [];
        const canvas = document.createElement('canvas');
        canvas.width = pieceSize;
        canvas.height = pieceSize;
        const ctx = canvas.getContext('2d');

        if (ctx) {
            for (let y = 0; y < 3; y++) {
                for (let x = 0; x < 3; x++) {
                    ctx.clearRect(0, 0, pieceSize, pieceSize);
                    ctx.drawImage(img, x * pieceSize, y * pieceSize, pieceSize, pieceSize, 0, 0, pieceSize, pieceSize);
                    newPieces.push({
                        id: y * 3 + x,
                        currentSlot: null,
                        src: canvas.toDataURL()
                    });
                }
            }
            // Shuffle pieces in bank
            const shuffled = [...newPieces].sort(() => Math.random() - 0.5);
            setPieces(shuffled);
            setLoading(false);
            speak("Resim hazır! Parçaları yerine koyabilir misin?");
        }
      };
    } catch (e) {
        console.error(e);
        setLoading(false);
        speak("Bir sorun oldu, tekrar deneyelim.");
    }
  };

  useEffect(() => {
    startNewPuzzle();
  }, []);

  const handlePieceClick = (pieceId: number) => {
    if (isSolved) return;
    
    // If clicking the same piece, deselect
    if (selectedPieceId === pieceId) {
        setSelectedPieceId(null);
        return;
    }
    
    setSelectedPieceId(pieceId);
    speak("Parçayı seçtin. Şimdi koymak istediğin kutuya tıkla.");
  };

  const handleSlotClick = (slotIndex: number) => {
    if (selectedPieceId === null || isSolved) return;

    // Find the selected piece
    const newPieces = [...pieces];
    const selectedPieceIndex = newPieces.findIndex(p => p.id === selectedPieceId);
    if (selectedPieceIndex === -1) return;

    const selectedPiece = newPieces[selectedPieceIndex];
    
    // Check if slot is occupied
    const existingPieceIndex = newPieces.findIndex(p => p.currentSlot === slotIndex);

    if (existingPieceIndex !== -1) {
        // Swap: existing piece goes to bank (or swap logic, but simplistic: return to bank)
        // Let's implement Swap: If selected piece was on board, swap positions. 
        // If selected piece was in bank, move existing to bank (or selected's old spot).
        
        // For simplicity for kids: If slot occupied, move occupant to Bank (currentSlot = null)
        newPieces[existingPieceIndex].currentSlot = null;
    }

    // Move selected piece
    selectedPiece.currentSlot = slotIndex;
    setPieces(newPieces);
    setSelectedPieceId(null);

    // Check Win
    checkWin(newPieces);
  };

  const checkWin = (currentPieces: PuzzlePiece[]) => {
      const allCorrect = currentPieces.every(p => p.currentSlot === p.id);
      if (allCorrect) {
          setIsSolved(true);
          speak("Tebrikler! Yapbozu tamamladın!");
          const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/cartoon_boing.ogg');
          audio.volume = 0.2;
          audio.play().catch(()=>{});
      } else {
          // Play click sound
           const audio = new Audio('https://actions.google.com/sounds/v1/cartoon/pop.ogg');
           audio.volume = 0.2;
           audio.play().catch(()=>{});
      }
  };

  // Render Grid Slots
  const renderSlot = (index: number) => {
      const piece = pieces.find(p => p.currentSlot === index);
      
      return (
          <div 
            key={index}
            onClick={() => handleSlotClick(index)}
            className={`w-full aspect-square border-2 border-[#d7c49e] bg-[#fff8e1]/50 relative flex items-center justify-center cursor-pointer overflow-hidden ${
                selectedPieceId !== null ? 'hover:bg-[#f4a261]/50 animate-pulse' : ''
            }`}
          >
              {piece ? (
                  <img 
                    src={piece.src} 
                    className="w-full h-full object-cover pointer-events-none" 
                  />
              ) : (
                  <div className="text-[#d7c49e] opacity-30 text-2xl font-bold">{index + 1}</div>
              )}
          </div>
      );
  };

  return (
    <div className="min-h-screen bg-[#fffae0] flex flex-col font-[VT323] overflow-x-hidden"
         style={{ backgroundImage: `radial-gradient(#e6ccb2 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
      
      {/* Header */}
      <header className="p-3 md:p-4 bg-[#8b4513] border-b-4 border-[#5d4037] shadow-lg flex items-center justify-between sticky top-0 z-20">
        <button 
          onClick={onBack}
          className="bg-[#fff8e1] text-[#5d4037] px-3 py-1 md:px-4 md:py-2 text-xl md:text-2xl border-b-4 border-[#5d4037] active:border-b-0 active:translate-y-1 hover:bg-[#ffe5b4] flex items-center gap-2 shadow-md rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          Menü
        </button>
        
        <h1 className="text-2xl md:text-3xl text-[#fff] flex items-center gap-2 drop-shadow-md">
            <Puzzle className="w-6 h-6 md:w-8 md:h-8" />
            Yapboz Çiftliği
        </h1>
        <div className="w-[88px]"></div>
      </header>

      <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full flex flex-col items-center">
        
        {loading ? (
             <div className="flex flex-col items-center justify-center mt-20">
                 <Loader2 className="w-16 h-16 text-[#e76f51] animate-spin mb-4" />
                 <p className="text-3xl text-[#5d4037] animate-pulse">Resim Yapılıyor...</p>
             </div>
        ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start w-full justify-center">
                
                {/* LEFT: Target Image */}
                <div className="flex flex-col gap-4 items-center order-2 lg:order-1">
                     <div className="bg-[#fff8e1] p-3 border-[6px] border-[#5d4037] shadow-lg transform -rotate-1 w-48 md:w-64">
                        <p className="text-center text-[#5d4037] text-xl mb-2 font-bold border-b-2 border-[#d7c49e]">HEDEF</p>
                        <img src={targetImage || ''} className="w-full aspect-square object-cover border-2 border-[#d7c49e]" />
                     </div>
                     <button 
                        onClick={startNewPuzzle}
                        className="bg-[#2a9d8f] text-white py-2 px-6 rounded-lg border-b-[4px] border-[#1d736a] active:border-b-0 active:translate-y-1 text-xl flex items-center gap-2 shadow-md hover:bg-[#34b6a7]"
                     >
                        <RefreshCw className="w-5 h-5" /> Yeni Resim
                     </button>
                </div>

                {/* CENTER: The Board */}
                <div className="bg-[#d4a373] p-4 md:p-6 border-[8px] border-[#5d4037] shadow-[12px_12px_0px_rgba(93,64,55,0.4)] rounded-xl order-1 lg:order-2 relative">
                    {/* Screws */}
                    <div className="absolute top-2 left-2 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                    <div className="absolute top-2 right-2 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                    <div className="absolute bottom-2 left-2 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
                    <div className="absolute bottom-2 right-2 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>

                    <div className="grid grid-cols-3 gap-1 bg-[#5d4037] p-1 w-[300px] h-[300px] md:w-[400px] md:h-[400px]">
                        {[0,1,2,3,4,5,6,7,8].map(i => renderSlot(i))}
                    </div>
                    
                    {isSolved && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-lg z-10 backdrop-blur-sm">
                            <div className="bg-[#fff8e1] p-6 border-[6px] border-[#5d4037] shadow-2xl flex flex-col items-center animate-bounce-slow rounded-xl">
                                <Sparkles className="w-16 h-16 text-[#e9c46a] mb-2" />
                                <h2 className="text-4xl text-[#5d4037] font-bold">HARİKA!</h2>
                                <button 
                                    onClick={startNewPuzzle}
                                    className="mt-4 bg-[#e76f51] text-white py-2 px-6 rounded-lg border-b-[4px] border-[#9d0208] text-2xl hover:bg-[#f08c75]"
                                >
                                    Tekrar Oyna
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* RIGHT/BOTTOM: Pieces Bank */}
                <div className="w-full lg:w-64 bg-[#faedcd] p-4 border-[6px] border-[#b08968] shadow-lg rounded-xl order-3 flex flex-col gap-4 min-h-[200px]">
                    <h3 className="text-2xl text-[#5d4037] text-center border-b-2 border-[#d7c49e] pb-2 flex items-center justify-center gap-2">
                        <Puzzle className="w-5 h-5" /> Parçalar
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-center">
                        {pieces.map(piece => {
                            if (piece.currentSlot !== null) return null; // Only show if not on board
                            
                            const isSelected = selectedPieceId === piece.id;
                            return (
                                <div 
                                    key={piece.id}
                                    onClick={() => handlePieceClick(piece.id)}
                                    className={`w-20 h-20 md:w-24 md:h-24 border-2 cursor-pointer transition-transform hover:scale-105 shadow-sm ${
                                        isSelected 
                                        ? 'border-[#e76f51] ring-4 ring-[#e76f51] ring-opacity-50 z-10 scale-110' 
                                        : 'border-[#d7c49e]'
                                    }`}
                                >
                                    <img src={piece.src} className="w-full h-full object-cover" />
                                </div>
                            );
                        })}
                        {pieces.every(p => p.currentSlot !== null) && !isSolved && (
                            <div className="text-[#d7c49e] text-center py-4">Tüm parçalar tahtada!</div>
                        )}
                    </div>
                </div>

            </div>
        )}

      </div>
    </div>
  );
};

export default JigsawPuzzle;