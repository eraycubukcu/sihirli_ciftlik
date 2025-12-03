import { GoogleGenAI } from "@google/genai";

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- Audio Context Management for Global TTS ---
let audioContext: AudioContext | null = null;
let currentSource: AudioBufferSourceNode | null = null;

/**
 * Generates a character image based on a description suitable for children.
 * Now optimized for Pixel Art / Stardew Valley theme.
 */
export const generateCharacterImage = async (name: string, description: string): Promise<string> => {
  try {
    const prompt = `A cute pixel art character portrait of ${name}. 
    Description: ${description}. 
    Style: Stardew Valley inspired, 16-bit retro pixel art, vibrant colors, white background. 
    Make it look like a friendly RPG character icon suitable for children.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating character:", error);
    return `https://api.dicebear.com/9.x/pixel-art/svg?seed=${encodeURIComponent(name)}`;
  }
};

/**
 * Generates a simple, colorful scene for a jigsaw puzzle.
 */
export const generatePuzzleImage = async (): Promise<string> => {
  try {
    const subjects = [
        'farm animals in a sunny meadow', 
        'a colorful underwater coral reef with fish', 
        'cute dinosaurs playing in prehistoric jungle', 
        'space rocket and smiling planets', 
        'magical forest with glowing mushrooms and fairies', 
        'a busy town with cute colorful cars'
    ];
    const randomSubject = subjects[Math.floor(Math.random() * subjects.length)];
    
    const prompt = `A cute, vibrant, detailed cartoon illustration of ${randomSubject}. 
    Style: Children's book illustration, colorful, clear outlines, simple shapes, high contrast. 
    Make it suitable for a jigsaw puzzle for kids. Aspect ratio 1:1.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }]
      },
      config: {
        imageConfig: {
            aspectRatio: "1:1"
        }
      }
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating puzzle image:", error);
    return `https://image.pollinations.ai/prompt/cute%20cartoon%20puzzle%20image?width=512&height=512&nologo=true`;
  }
};

/**
 * Generates high-quality speech from text using Gemini TTS.
 * Uses the 'Kore' voice which is a high-quality female voice.
 */
export const generateSpeech = async (text: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: {
        parts: [{ text: text }],
      },
      config: {
        responseModalities: ["AUDIO"],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: "Kore" },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) throw new Error("No audio generated");
    
    return base64Audio;
  } catch (error) {
    console.error("TTS Error:", error);
    throw error;
  }
};

/**
 * Centralized function to play TTS using Gemini 'Kore' voice.
 * Handles AudioContext, Decoding, and stopping previous sounds.
 */
export const playTTS = async (text: string): Promise<void> => {
    // 1. Initialize Audio Context if needed
    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
    }

    // 2. Stop any currently playing audio
    if (currentSource) {
        try {
            currentSource.stop();
        } catch (e) {
            // Ignore error if already stopped
        }
        currentSource = null;
    }

    // 3. Resume context if suspended (browser policy)
    if (audioContext.state === 'suspended') {
        await audioContext.resume();
    }

    try {
        // 4. Fetch Audio from Gemini
        const base64Audio = await generateSpeech(text);

        // 5. Decode Base64 to ArrayBuffer
        const binaryString = atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // 6. Decode PCM (16-bit little-endian, 24kHz) to Float32 AudioBuffer
        const dataInt16 = new Int16Array(bytes.buffer);
        const numChannels = 1;
        const sampleRate = 24000;
        const frameCount = dataInt16.length / numChannels;
        
        const buffer = audioContext.createBuffer(numChannels, frameCount, sampleRate);
        const channelData = buffer.getChannelData(0); // Mono
        
        for (let i = 0; i < frameCount; i++) {
            channelData[i] = dataInt16[i] / 32768.0;
        }

        // 7. Play Audio
        const source = audioContext.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContext.destination);
        currentSource = source;
        
        return new Promise((resolve) => {
            source.onended = () => {
                resolve();
            };
            source.start();
        });

    } catch (error) {
        console.error("Failed to play Gemini TTS:", error);
        // Fallback to Browser TTS (Female preference) just in case API fails
        return new Promise((resolve) => {
             const u = new SpeechSynthesisUtterance(text);
             u.lang = 'tr-TR';
             u.rate = 0.9;
             u.pitch = 1.1;
             const voices = window.speechSynthesis.getVoices();
             const trVoice = voices.find(v => v.lang.startsWith('tr') && (v.name.includes('Yelda') || v.name.includes('Emel') || v.name.includes('Google'))) || voices.find(v => v.lang.startsWith('tr'));
             if (trVoice) u.voice = trVoice;
             u.onend = () => resolve();
             window.speechSynthesis.cancel();
             window.speechSynthesis.speak(u);
        });
    }
};

export const stopAudio = () => {
    if (currentSource) {
        try {
            currentSource.stop();
        } catch (e) {}
        currentSource = null;
    }
    window.speechSynthesis.cancel();
};