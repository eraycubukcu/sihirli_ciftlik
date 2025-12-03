import React, { useState, useRef, useEffect } from 'react';
import { Character } from '../types';
import { playTTS, stopAudio } from '../services/geminiService';
import { Check, Paintbrush, ArrowLeft, Eraser, Trash2 } from 'lucide-react';

interface CharacterPainterProps {
  onComplete: (character: Character) => void;
  onBack: () => void;
}

const COLORS = [
  "#000000", "#5d4037", "#ef4444", "#f97316", "#facc15", 
  "#4ade80", "#22d3ee", "#3b82f6", "#a855f7", "#ec4899", 
  "#ffffff", "#94a3b8"
];

const CharacterPainter: React.FC<CharacterPainterProps> = ({ onComplete, onBack }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState("#000000");
  const [brushSize, setBrushSize] = useState(5);
  const [tool, setTool] = useState<'brush' | 'eraser'>('brush');
  const [name, setName] = useState('');

  const speak = (text: string) => {
      playTTS(text);
  };

  useEffect(() => {
    return () => stopAudio();
  }, []);

  // Initialize Canvas with White Background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }
    }
  }, []);

  const getCoordinates = (event: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;

    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = (event as React.MouseEvent).clientX;
      clientY = (event as React.MouseEvent).clientY;
    }

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY
    };
  };

  const startDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    // Prevent default scrolling only if target is canvas
    if (e.target === canvasRef.current) {
        e.preventDefault();
    }
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    if (e.target === canvasRef.current) {
        e.preventDefault();
    }

    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext('2d');
    
    if (ctx) {
      ctx.lineTo(x, y);
      ctx.strokeStyle = tool === 'eraser' ? '#ffffff' : color;
      ctx.lineWidth = brushSize;
      ctx.stroke();
    }
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    const ctx = canvasRef.current?.getContext('2d');
    if (ctx) {
      ctx.closePath();
    }
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    }
    speak("Sayfa tertemiz oldu!");
  };

  const handleComplete = () => {
    if (!canvasRef.current) return;
    
    // Export image as Data URL
    const imageUrl = canvasRef.current.toDataURL("image/png");

    const newChar: Character = {
      id: Date.now().toString(),
      name: name.trim() || 'Minik Ressam',
      description: 'Elle çizilmiş özel karakter',
      imageUrl
    };
    
    speak("Harika bir resim! Ekliyorum.");
    onComplete(newChar);
  };

  return (
    <div className="min-h-screen bg-[#fffae0] flex flex-col items-center font-[VT323] overflow-x-hidden touch-none"
         style={{ backgroundImage: `radial-gradient(#e6ccb2 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
      
      {/* Header */}
      <header className="p-3 md:p-4 w-full bg-[#d4a373] border-b-4 border-[#5d4037] shadow-lg flex items-center justify-between mb-4 md:mb-6 sticky top-0 z-10">
        <button 
          onClick={onBack}
          className="bg-[#a98467] text-[#fff] px-3 py-1 md:px-4 md:py-2 text-xl md:text-2xl border-b-4 border-[#5d4037] active:border-b-0 active:translate-y-1 hover:bg-[#c29d82] flex items-center gap-2 shadow-lg rounded-lg"
        >
          <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          Geri
        </button>

        <h1 className="text-3xl md:text-3xl text-[#5d4037] flex items-center gap-3 absolute left-1/2 transform -translate-x-1/2 w-max drop-shadow-sm">
          <Paintbrush className="w-6 h-6 md:w-8 md:h-8" />
          <span className="hidden sm:inline">Resim Atölyesi</span>
        </h1>
        <div className="w-[88px]"></div>
      </header>

      <div className="w-full max-w-6xl px-4 md:px-8 flex-1 flex flex-col lg:flex-row gap-6 lg:gap-8 items-start justify-center pb-24">
        
        {/* LEFT PANEL: Canvas (Easle) */}
        <div className="bg-[#fff8e1] p-4 border-[8px] border-[#5d4037] shadow-[12px_12px_0px_rgba(93,64,55,0.4)] relative rounded-xl w-full lg:w-auto flex flex-col items-center">
            {/* Screws */}
            <div className="absolute top-3 left-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>
            <div className="absolute top-3 right-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-60"></div>

             <div className="bg-[#d7c49e] p-2 border-[4px] border-[#8b4513] shadow-inner cursor-crosshair">
                <canvas 
                  ref={canvasRef}
                  width={500}
                  height={500}
                  className="bg-white w-full max-w-[300px] md:max-w-[400px] lg:max-w-[500px] aspect-square block touch-none"
                  style={{ touchAction: 'none' }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
             </div>
             
             <div className="mt-4 flex gap-4 w-full justify-center">
                <button 
                  onClick={() => { setTool('brush'); speak("Fırçayı seçtin."); }}
                  className={`p-2 md:p-3 rounded-lg border-b-[4px] text-lg md:text-xl transition-all flex items-center gap-2 ${
                    tool === 'brush' 
                    ? 'bg-[#588157] text-white border-[#3a5a40] translate-y-1 border-b-0' 
                    : 'bg-[#a98467] text-white border-[#5d4037] hover:bg-[#c29d82]'
                  }`}
                >
                    <Paintbrush size={20} /> Fırça
                </button>
                <button 
                  onClick={() => { setTool('eraser'); speak("Silgiyi seçtin."); }}
                  className={`p-2 md:p-3 rounded-lg border-b-[4px] text-lg md:text-xl transition-all flex items-center gap-2 ${
                    tool === 'eraser' 
                    ? 'bg-[#e63946] text-white border-[#9d0208] translate-y-1 border-b-0' 
                    : 'bg-[#a98467] text-white border-[#5d4037] hover:bg-[#c29d82]'
                  }`}
                >
                    <Eraser size={20} /> Silgi
                </button>
             </div>
        </div>

        {/* RIGHT PANEL: Tools */}
        <div className="bg-[#d4a373] p-4 md:p-6 border-[8px] border-[#5d4037] shadow-[12px_12px_0px_rgba(93,64,55,0.4)] w-full lg:w-[350px] rounded-xl lg:sticky lg:top-24">
            
            {/* Brush Size */}
            <div className="bg-[#fff8e1] p-3 border-[4px] border-[#b08968] mb-4 shadow-inner">
                 <label className="block text-xl text-[#5d4037] mb-2">Kalınlık: {brushSize}</label>
                 <input 
                    type="range" 
                    min="2" 
                    max="30" 
                    value={brushSize} 
                    onChange={(e) => setBrushSize(parseInt(e.target.value))}
                    className="w-full h-4 bg-[#e6ccb2] rounded-lg appearance-none cursor-pointer border-2 border-[#5d4037] accent-[#e76f51]"
                 />
            </div>

            {/* Color Palette */}
            <div className="bg-[#fff8e1] p-3 border-[4px] border-[#b08968] mb-4 shadow-inner">
              <h3 className="text-xl text-[#5d4037] mb-2 border-b-2 border-[#e6ccb2] pb-1">Renkler</h3>
              <div className="grid grid-cols-4 gap-2">
                {COLORS.map(c => (
                  <button
                    key={c}
                    onClick={() => { setColor(c); setTool('brush'); }}
                    className={`aspect-square border-4 transition-transform transform hover:scale-110 shadow-sm rounded-sm ${
                      color === c && tool === 'brush' ? 'border-[#5d4037] scale-110 ring-2 ring-[#5d4037] ring-offset-2 ring-offset-[#fff8e1]' : 'border-white'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}
              </div>
            </div>

            {/* Name Input */}
            <div className="bg-[#fff8e1] p-3 border-[4px] border-[#b08968] mb-4 shadow-inner">
              <label className="block text-xl text-[#5d4037] mb-1">Resmin Adı</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Örn: Renkli Kuş"
                maxLength={15}
                className="w-full bg-transparent border-b-4 border-[#d7c49e] focus:border-[#e76f51] outline-none text-xl md:text-2xl text-[#5d4037] placeholder:text-[#d7c49e]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col gap-3">
              <button 
                onClick={clearCanvas}
                className="w-full py-3 bg-[#e76f51] text-[#fff] border-b-[6px] border-[#9d0208] active:border-b-0 active:translate-y-1 hover:bg-[#f08c75] text-xl md:text-2xl flex items-center justify-center gap-2 rounded-lg transition-all"
              >
                <Trash2 className="w-5 h-5" /> Sayfayı Temizle
              </button>
              <button 
                onClick={handleComplete}
                className="w-full py-3 bg-[#588157] text-white border-b-[6px] border-[#3a5a40] active:border-b-0 active:translate-y-1 hover:bg-[#6a994e] text-2xl md:text-3xl flex items-center justify-center gap-2 shadow-xl rounded-lg transition-all"
              >
                <Check className="w-6 h-6 md:w-8 md:h-8" /> TAMAMLA!
              </button>
            </div>

        </div>
      </div>
    </div>
  );
};

export default CharacterPainter;