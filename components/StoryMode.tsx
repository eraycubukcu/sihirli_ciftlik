import React, { useState, useEffect, useRef } from 'react';
import { ArrowLeft, BookOpen, ChevronRight, ChevronLeft, Volume2, Home, Loader2 } from 'lucide-react';
import { playTTS, stopAudio } from '../services/geminiService';

interface Story {
  id: string;
  title: string;
  coverColor: string;
  scenes: {
    text: string;
    imageKeyword: string; // Used for placeholder images
  }[];
}

const STORIES: Story[] = [
  {
    id: '1',
    title: 'Yalnız Robotun Arkadaşı',
    coverColor: '#e76f51',
    scenes: [
      {
        text: "Bir zamanlar, uzak bir gezegende Teneke adında küçük bir robot yaşardı. Teneke'nin hiç arkadaşı yoktu.",
        imageKeyword: "cute sad robot on planet"
      },
      {
        text: "Bir gün gökyüzünden parlak bir ışık düştü. Teneke merakla oraya gitti. O da ne? Küçük mavi bir kuş!",
        imageKeyword: "cute robot looking at blue bird"
      },
      {
        text: "Kuşun kanadı incinmişti. Teneke onu tamir etti. O günden sonra hiç ayrılmadılar ve çok mutlu oldu.",
        imageKeyword: "robot and bird happy together friends"
      }
    ]
  },
  {
    id: '2',
    title: 'Sihirli Orman',
    coverColor: '#2a9d8f',
    scenes: [
      {
        text: "Kocaman ağaçların olduğu yeşil bir ormanda, yaprakların arasında saklanan minik periler vardı.",
        imageKeyword: "magical forest with fairies"
      },
      {
        text: "Periler geceleri ortaya çıkar, çiçeklerin üzerine sihirli tozlar serperlerdi. Her yer ışıl ışıl olurdu.",
        imageKeyword: "glowing fairy dust flowers night"
      },
      {
        text: "Ormana gelen çocuklar bu ışıkları görünce hayallere dalar, güzel rüyalar görürlerdi.",
        imageKeyword: "happy children in magical forest"
      }
    ]
  },
  {
    id: '3',
    title: 'Uzaylı Zıpzıp',
    coverColor: '#a2d2ff',
    scenes: [
      {
        text: "Zıpzıp, mor renkli ve üç gözlü sevimli bir uzaylıydı. En sevdiği şey yıldızların üzerinde zıplamaktı.",
        imageKeyword: "cute purple alien three eyes space"
      },
      {
        text: "Bir gün o kadar yükseğe zıpladı ki, kendini Ay Dede'nin burnunda buldu! Ay Dede gıdıklandı.",
        imageKeyword: "alien jumping on moon face cartoon"
      },
      {
        text: "Zıpzıp özür diledi. Ay Dede güldü ve ona kayan bir yıldıza binip evine gitmesi için yardım etti.",
        imageKeyword: "alien riding shooting star"
      }
    ]
  },
  {
    id: '4',
    title: 'Cesur Kaplumbağa',
    coverColor: '#8da399',
    scenes: [
      {
        text: "Tostos, çok yavaş yürüyen sevimli bir kaplumbağaydı. Ama en büyük hayali tepenin ardındaki gölü görmekti.",
        imageKeyword: "cute turtle walking nature"
      },
      {
        text: "Yolda tavşan onunla dalga geçti, 'Sen oraya asla varamazsın!' dedi. Tostos dinlemedi, yürümeye devam etti.",
        imageKeyword: "turtle and rabbit cartoon"
      },
      {
        text: "Güneş batarken Tostos tepeye ulaştı. Manzara harikaydı! Yavaş da olsa, vazgeçmediği için başarmıştı.",
        imageKeyword: "turtle looking at beautiful lake sunset"
      }
    ]
  },
  {
    id: '5',
    title: 'Uykucu Baykuş',
    coverColor: '#6d597a',
    scenes: [
      {
        text: "Gündüzleri herkes uyanıkken, Baykuş Puki mışıl mışıl uyurdu. Gece olunca gözleri kocaman açılırdı.",
        imageKeyword: "sleeping cute owl in tree day"
      },
      {
        text: "Bir gece, ormanda kaybolan küçük bir sincap gördü. Sincap evini bulamıyordu ve çok korkmuştu.",
        imageKeyword: "scared baby squirrel forest night"
      },
      {
        text: "Puki, karanlıkta çok iyi görebildiği için sincaba yardım etti ve onu güvenle annesine götürdü.",
        imageKeyword: "owl helping squirrel friends"
      }
    ]
  },
  {
    id: '6',
    title: 'Renkli Balık',
    coverColor: '#f4a261',
    scenes: [
      {
        text: "Denizin derinliklerinde, pulları gökkuşağı gibi parlayan bir balık yaşardı. Herkes ona hayranlıkla bakardı.",
        imageKeyword: "rainbow colored fish underwater"
      },
      {
        text: "Ama o hiç kimseyle oynamaz, pulları kirlenmesin diye hep yalnız gezerdi. Bu yüzden çok yalnızdı.",
        imageKeyword: "sad colorful fish alone"
      },
      {
        text: "Bir gün küçük bir balığa yardım edince neşelendi. Paylaşmanın ve arkadaşlığın güzellikten daha önemli olduğunu anladı.",
        imageKeyword: "happy colorful fish playing with friends"
      }
    ]
  },
  {
    id: '7',
    title: 'Çalışkan Karınca',
    coverColor: '#e63946',
    scenes: [
        {
          text: "Yaz mevsimiydi. Ağustos böceği şarkı söylerken, Karınca Kiki durmadan buğday taşıyordu.",
          imageKeyword: "cute ant carrying food cartoon"
        },
        {
          text: "Kiki çok yorulmuştu ama kışın aç kalmamak için çalışması gerektiğini biliyordu. Yuvasını yiyecekle doldurdu.",
          imageKeyword: "ant nest underground food"
        },
        {
          text: "Kış geldiğinde kar yağdı. Kiki sıcak yuvasında yemeğini yedi ve çok mutlu oldu.",
          imageKeyword: "winter snow happy ant in home"
        }
    ]
  },
  {
    id: '8',
    title: 'Küçük Bulut',
    coverColor: '#a8dadc',
    scenes: [
        {
          text: "Gökyüzünde Pamuk adında küçük beyaz bir bulut vardı. Pamuk hep aşağıya yağmur yağdırmak isterdi.",
          imageKeyword: "cute happy cloud in blue sky"
        },
        {
          text: "Bir gün susamış bir çiçek gördü. 'Lütfen bana su ver' dedi çiçek. Pamuk hemen kendini sıktı.",
          imageKeyword: "cloud raining on thirsty flower"
        },
        {
          text: "Yağmur yağınca güneş açtı ve gökyüzünde rengarenk bir gökkuşağı çıktı. Çiçek teşekkür etti.",
          imageKeyword: "rainbow flowers sunny meadow"
        }
    ]
  },
  {
    id: '9',
    title: 'Kayıp Dinozor',
    coverColor: '#bc6c25',
    scenes: [
        {
          text: "Dino, ormanda oyun oynarken annesinden uzaklaştı. Etrafına baktı ama annesini göremedi.",
          imageKeyword: "cute baby dinosaur lost in forest"
        },
        {
          text: "Bir kelebek gördü ve onu takip etmeye başladı. Kelebek onu nehrin kenarına götürdü.",
          imageKeyword: "baby dinosaur following butterfly"
        },
        {
          text: "Nehrin kenarında annesi su içiyordu! Dino koşarak annesine sarıldı. Çok mutluydu.",
          imageKeyword: "mother and baby dinosaur hugging happy"
        }
    ]
  }
];

interface StoryModeProps {
    onBack: () => void;
}

const StoryMode: React.FC<StoryModeProps> = ({ onBack }) => {
    const [selectedStory, setSelectedStory] = useState<Story | null>(null);
    const [pageIndex, setPageIndex] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const isPlayingRef = useRef(false);

    // Initial greeting
    useEffect(() => {
        if (!selectedStory) {
            playTTS("Masal köşesine hoş geldin! Okumak istediğin masalı seç.");
        }
    }, [selectedStory]);

    // Handle audio for stories
    const handlePlayStory = async (text: string) => {
        isPlayingRef.current = true;
        setIsPlaying(true);
        try {
            await playTTS(text);
        } finally {
            // Only set to false if we haven't started another one immediately (though playTTS handles cancelling)
            if (isPlayingRef.current) {
                setIsPlaying(false);
                isPlayingRef.current = false;
            }
        }
    };

    // Auto-read page when it changes
    useEffect(() => {
        if (selectedStory) {
            // Stop any previous audio implicitly handled by playTTS, but we manage UI state
            handlePlayStory(selectedStory.scenes[pageIndex].text);
        }
    }, [selectedStory, pageIndex]);

    const handleSelectStory = (story: Story) => {
        setSelectedStory(story);
        setPageIndex(0);
    };

    const handleBackToMenu = () => {
        stopAudio();
        isPlayingRef.current = false;
        setSelectedStory(null);
    };

    const handleNextPage = () => {
        if (selectedStory && pageIndex < selectedStory.scenes.length - 1) {
            setPageIndex(prev => prev + 1);
        } else {
            playTTS("Masal bitti! Başka bir masal seçelim mi?");
            setTimeout(() => {
                handleBackToMenu();
            }, 3000);
        }
    };

    const handlePrevPage = () => {
        if (pageIndex > 0) {
            setPageIndex(prev => prev - 1);
        }
    };

    return (
        <div className="min-h-screen bg-[#fffae0] flex flex-col font-[VT323] overflow-x-hidden"
             style={{ backgroundImage: `radial-gradient(#e6ccb2 1px, transparent 1px)`, backgroundSize: '20px 20px' }}>
            
            {/* Header */}
            <header className="p-3 md:p-4 bg-[#2a9d8f] border-b-4 border-[#1d736a] shadow-lg flex items-center justify-between sticky top-0 z-20">
                <button 
                  onClick={selectedStory ? handleBackToMenu : onBack}
                  className="bg-[#fff] text-[#1d736a] px-3 py-1 md:px-4 md:py-2 text-xl md:text-2xl border-b-4 border-[#134e48] active:border-b-0 active:translate-y-1 hover:bg-[#e0f2f1] flex items-center gap-2 shadow-md rounded-lg"
                >
                  <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
                  {selectedStory ? 'Kitaplar' : 'Ana Menü'}
                </button>
                
                <h1 className="text-2xl md:text-3xl text-[#fff] flex items-center gap-2 drop-shadow-md">
                    <BookOpen className="w-6 h-6 md:w-8 md:h-8" />
                    {selectedStory ? selectedStory.title : 'Masal Köşesi'}
                </h1>
                <div className="w-[88px] hidden md:block"></div> {/* Spacer */}
            </header>

            <div className="flex-1 p-4 md:p-6 max-w-6xl mx-auto w-full">
                
                {/* STORY LIST */}
                {!selectedStory && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {STORIES.map(story => (
                            <button 
                                key={story.id}
                                onClick={() => handleSelectStory(story)}
                                onMouseEnter={() => playTTS(story.title)}
                                className="relative bg-[#fff] border-[6px] border-[#5d4037] shadow-[8px_8px_0px_rgba(42,157,143,0.4)] hover:scale-[1.02] transition-transform text-left group rounded-xl flex flex-col h-72 md:h-80 overflow-hidden"
                            >
                                <div className="w-full h-40 md:h-48 bg-[#e0e0e0] border-b-4 border-[#5d4037] relative overflow-hidden">
                                     <img 
                                        src={`https://image.pollinations.ai/prompt/${encodeURIComponent(story.scenes[0].imageKeyword + " cute children book illustration, vector art, vibrant colors, simple shapes, storybook style")}`} 
                                        alt={story.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        loading="lazy"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                                    <div className="absolute bottom-2 left-3 text-white">
                                        <BookOpen className="w-6 h-6 opacity-90 drop-shadow-md" />
                                    </div>
                                </div>
                                
                                <div className="p-4 flex-1 flex flex-col">
                                    <h3 className="text-2xl md:text-3xl text-[#5d4037] leading-none mb-2 font-bold group-hover:text-[#2a9d8f] transition-colors line-clamp-2">
                                        {story.title}
                                    </h3>
                                    <div className="mt-auto flex justify-between items-center text-[#8b4513] opacity-70">
                                        <span className="text-lg">{story.scenes.length} Sayfa</span>
                                        <span className="text-lg border-2 border-[#8b4513] px-3 rounded-full hover:bg-[#8b4513] hover:text-white transition-colors">Oku</span>
                                    </div>
                                </div>
                            </button>
                        ))}
                    </div>
                )}

                {/* STORY READER */}
                {selectedStory && (
                    <div className="flex flex-col items-center h-full justify-center max-w-4xl mx-auto">
                        <div className="bg-[#fff] p-4 md:p-8 border-[8px] border-[#5d4037] shadow-[12px_12px_0px_rgba(42,157,143,0.4)] rounded-xl w-full relative min-h-[50vh] flex flex-col">
                            
                            {/* Screws */}
                            <div className="absolute top-3 left-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-50"></div>
                            <div className="absolute top-3 right-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-50"></div>
                            <div className="absolute bottom-3 left-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-50"></div>
                            <div className="absolute bottom-3 right-3 w-3 h-3 bg-[#5d4037] rounded-full opacity-50"></div>

                            {/* Image Placeholder Area */}
                            <div className="w-full h-48 md:h-80 bg-[#f0f0f0] mb-6 rounded-lg border-4 border-[#d7c49e] overflow-hidden relative group">
                                <img 
                                    src={`https://image.pollinations.ai/prompt/${encodeURIComponent(selectedStory.scenes[pageIndex].imageKeyword + " cute children book illustration, vector art, vibrant colors, simple shapes, high quality, detailed")}`} 
                                    alt="Scene"
                                    className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-110"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = 'https://placehold.co/800x600/e0e0e0/a0a0a0?text=Resim+Y%C3%BCklenemedi';
                                    }}
                                />
                                <div className="absolute bottom-2 right-2 bg-white/80 px-2 py-1 rounded text-xs text-[#5d4037]">
                                    Sayfa {pageIndex + 1} / {selectedStory.scenes.length}
                                </div>
                            </div>

                            {/* Text Area */}
                            <div className="flex-1 flex flex-col items-center justify-center text-center px-2 md:px-6">
                                <p className="text-2xl md:text-4xl text-[#5d4037] leading-relaxed animate-[fadeIn_0.5s]">
                                    {selectedStory.scenes[pageIndex].text}
                                </p>
                            </div>

                            {/* Controls */}
                            <div className="mt-6 md:mt-8 flex items-center justify-between gap-4">
                                <button 
                                    onClick={handlePrevPage}
                                    disabled={pageIndex === 0}
                                    className={`p-3 md:p-4 rounded-full border-[3px] border-[#5d4037] transition-all ${
                                        pageIndex === 0 
                                        ? 'bg-[#e0e0e0] text-[#a0a0a0] cursor-not-allowed opacity-50' 
                                        : 'bg-[#e9c46a] text-[#5d4037] hover:bg-[#f4a261] hover:scale-110 shadow-lg'
                                    }`}
                                >
                                    <ChevronLeft className="w-8 h-8 md:w-10 md:h-10" />
                                </button>

                                <button 
                                    onClick={() => handlePlayStory(selectedStory.scenes[pageIndex].text)}
                                    className={`p-4 rounded-full bg-[#2a9d8f] text-white border-[3px] border-[#1d736a] shadow-lg hover:bg-[#34b6a7] hover:scale-110 transition-transform ${isPlaying ? 'animate-pulse ring-4 ring-[#a8dadc]' : ''}`}
                                >
                                    {isPlaying ? <Loader2 className="w-8 h-8 md:w-10 md:h-10 animate-spin" /> : <Volume2 className="w-8 h-8 md:w-10 md:h-10" />}
                                </button>

                                <button 
                                    onClick={handleNextPage}
                                    className="p-3 md:p-4 rounded-full bg-[#e9c46a] text-[#5d4037] border-[3px] border-[#5d4037] shadow-lg hover:bg-[#f4a261] hover:scale-110 transition-transform"
                                >
                                    {pageIndex === selectedStory.scenes.length - 1 ? (
                                        <Home className="w-8 h-8 md:w-10 md:h-10" />
                                    ) : (
                                        <ChevronRight className="w-8 h-8 md:w-10 md:h-10" />
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StoryMode;