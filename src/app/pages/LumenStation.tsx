import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import {
  Mic,
  Square,
  Pause,
  Play,
  Volume2,
  ChevronLeft,
  Loader2,
  Sparkles,
  MessageSquare,
} from "lucide-react";
import { ScrollArea } from "../components/ui/scroll-area";
import { chat as chatApi, Citation } from "@/lib/api";
import { toast } from "sonner";

// Extend Window interface for Web Speech API
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  isAudio?: boolean;
  citations?: Citation[];
}

export default function LumenStation() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentResponse, setCurrentResponse] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [accumulatedTranscript, setAccumulatedTranscript] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;
      recognitionRef.current.lang = 'es-ES';

      recognitionRef.current.onresult = (event: any) => {
        let interim = "";
        let finalForBatch = "";

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalForBatch += event.results[i][0].transcript;
          } else {
            interim += event.results[i][0].transcript;
          }
        }

        if (finalForBatch) {
          setAccumulatedTranscript(prev => {
            const newValue = (prev + " " + finalForBatch).trim();
            // Mantener solo las últimas ~30 palabras para evitar que llene la pantalla
            const words = newValue.split(" ");
            if (words.length > 30) {
              return "..." + words.slice(words.length - 30).join(" ");
            }
            return newValue;
          });
          setInterimTranscript("");
        } else {
          // Si el interim es muy largo, también lo recortamos para que no desplace todo
          const interimWords = interim.split(" ");
          if (interimWords.length > 20) {
            setInterimTranscript("..." + interimWords.slice(interimWords.length - 20).join(" "));
          } else {
            setInterimTranscript(interim);
          }
        }
      };

      recognitionRef.current.onerror = (event: any) => {
        console.error("Error de SpeechRecognition:", event.error);
        
        if (event.error === 'not-allowed') {
          toast.error("Permiso denegado: Por favor, habilita el micrófono en tu navegador.");
        } else if (event.error === 'network') {
          toast.error("Error de red: El navegador no puede conectarse al servicio de voz.");
        } else if (event.error !== 'no-speech' && event.error !== 'aborted') {
          toast.error("Error en el reconocimiento de voz: " + event.error);
        }
        
        if (event.error !== 'no-speech' && event.error !== 'aborted') {
            setIsRecording(false);
        }
      };

      recognitionRef.current.onend = () => {
        // Accedemos a los estados actuales usando refs o efectos, 
        // pero aquí necesitamos saber si debemos reiniciar.
        // Como onend se redefine en cada render si no tenemos cuidado, 
        // usaremos una técnica de ref para el estado actual si es necesario, 
        // o simplemente confiaremos en que el closure tiene acceso a los valores del render actual.
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, []);

  // Use a ref to keep track of isRecording and isPaused for the onend handler
  const isRecordingRef = useRef(isRecording);
  const isPausedRef = useRef(isPaused);
  
  useEffect(() => {
    isRecordingRef.current = isRecording;
    isPausedRef.current = isPaused;
  }, [isRecording, isPaused]);

  useEffect(() => {
    if (recognitionRef.current) {
      recognitionRef.current.onend = () => {
        if (isRecordingRef.current && !isPausedRef.current) {
          try {
            recognitionRef.current.start();
          } catch (err) {
            console.error("Error al reiniciar reconocimiento:", err);
            setIsRecording(false);
          }
        }
      };
    }
  }, []);

  // Typewriter effect for the latest assistant message
  useEffect(() => {
    const lastMessage = messages.filter(m => m.type === 'assistant').pop();
    if (lastMessage && !isProcessing) {
      let i = 0;
      setCurrentResponse("");
      const interval = setInterval(() => {
        const newText = lastMessage.content.slice(0, i + 1);
        setCurrentResponse(newText);
        i++;
        if (i >= lastMessage.content.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    }
  }, [messages, isProcessing]);

  // Clean up old responses displayed if they grow too much (sliding window for assistant text too)
  const assistantResponseText = (() => {
    if (!currentResponse) return "";
    const words = currentResponse.split(" ");
    if (words.length > 50) {
        return "..." + words.slice(words.length - 50).join(" ");
    }
    return currentResponse;
  })();

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isProcessing]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      setIsPaused(false);
      
      // Al terminar de grabar, procesamos lo acumulado
      if (accumulatedTranscript || interimTranscript) {
        handleUserSpeech((accumulatedTranscript + " " + interimTranscript).trim());
      }
      
      setInterimTranscript("");
      setAccumulatedTranscript("");
    } else {
      if (!recognitionRef.current) {
        toast.error("Tu navegador no soporta el reconocimiento de voz.");
        return;
      }
      
      // Stop any ongoing speech
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setCurrentResponse("");
      setInterimTranscript("");
      setAccumulatedTranscript("");
      
      try {
        recognitionRef.current.start();
        setIsRecording(true);
        setIsPaused(false);
      } catch (err) {
        console.error("Failed to start recognition", err);
      }
    }
  };

  const togglePause = () => {
    if (!recognitionRef.current) return;

    if (isPaused) {
        try {
            recognitionRef.current.start();
            setIsPaused(false);
        } catch (err) {
            console.error("Error al reanudar:", err);
        }
    } else {
        recognitionRef.current.stop();
        setIsPaused(true);
    }
  };

  const handleUserSpeech = async (transcript: string) => {
    // Clear responses to show user transcript during recording transition
    setCurrentResponse("");
    
    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: transcript,
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    processVoice(transcript);
  };

  const speak = (text: string) => {
    if (!window.speechSynthesis) return;

    // Cancel any current speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const processVoice = async (transcript: string) => {
    setIsProcessing(true);
    
    try {
      const response = await chatApi(transcript);
      
      const assistantMessage: Message = {
        id: Date.now().toString(),
        type: "assistant",
        content: response.answer,
        timestamp: new Date(),
        isAudio: true,
        citations: response.citations ?? [],
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      speak(response.answer);
    } catch (error) {
      console.error("Error processing voice chat:", error);
      toast.error("Hubo un error al procesar tu solicitud.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-slate-50 text-slate-900 overflow-hidden font-sans">
      {/* Header */}
      <header className="p-4 flex items-center justify-between border-b border-gray-200 bg-white/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate("/dashboard")}
            className="text-gray-500 hover:text-gray-900 hover:bg-gray-100"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              LUMEN Station
            </h1>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">Voice Interactive Interface</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : isSpeaking ? 'bg-blue-500 animate-pulse' : 'bg-green-500'}`} />
            <span className="text-xs text-gray-500 font-medium">
                {isRecording ? (isPaused ? 'Pausado' : 'Escuchando...') : isSpeaking ? 'Hablando...' : isProcessing ? 'Pensando...' : 'Listo'}
            </span>
        </div>
      </header>

      {/* Main Visualizer / Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center relative p-6">
        {/* Background Glows */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-1/4 right-1/4 w-[300px] h-[300px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />

        {/* AI Response Display (Alexa style) */}
        <div className="w-full max-w-4xl flex-1 flex items-center justify-center overflow-hidden z-20">
            {messages.length === 0 && !isProcessing && !isRecording && (
                <div className="text-center opacity-40 h-[50vh] flex items-center justify-center">
                    <p className="text-2xl font-medium text-gray-400">Presiona para hablar</p>
                </div>
            )}

            {isRecording ? (
                <div className="text-center px-4 w-full flex items-end justify-center h-[50vh] overflow-hidden relative">
                    <p className="text-2xl md:text-4xl font-medium leading-tight text-blue-600/70 transition-all duration-300 absolute bottom-0 w-full pb-4">
                        {accumulatedTranscript} <span className="text-blue-400">{interimTranscript}</span>
                        {!accumulatedTranscript && !interimTranscript && "Escuchando..."}
                    </p>
                </div>
            ) : isProcessing ? (
                <div className="flex flex-col items-center justify-center h-[50vh] gap-4">
                    <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
                    <p className="text-xl text-gray-500 font-medium animate-pulse">Procesando...</p>
                </div>
            ) : messages.length > 0 ? (
                <div className="text-center px-4 w-full flex items-center justify-center h-[50vh] overflow-hidden relative flex-col">
                    <p className="text-2xl md:text-4xl font-bold leading-tight text-slate-800 transition-all duration-500">
                        {assistantResponseText}
                    </p>
                    {(messages.filter(m => m.type === 'assistant').pop()?.isAudio || isSpeaking) && (
                         <div className="mt-6 flex items-center justify-center gap-2 text-blue-600 font-bold tracking-widest text-xs uppercase">
                            <Volume2 className="w-5 h-5" />
                            <span>{isSpeaking ? 'Escuchando voz' : 'Audio disponible'}</span>
                        </div>
                    )}
                </div>
            ) : null}
        </div>

        {/* Visualizer Waves (Now between/around buttons) */}
        <div className="h-16 flex items-center justify-center mb-4">
            {(isRecording || isSpeaking) && (
                <div className="flex gap-1.5 items-end h-10">
                    {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                        <div 
                            key={i} 
                            className={`w-1.5 bg-blue-600 rounded-full transition-all duration-300 ${
                                isPaused && !isSpeaking ? 'h-1.5' : ''
                            }`}
                            style={{ 
                                height: (isPaused && !isSpeaking) ? '6px' : `${Math.random() * 40 + 8}px`,
                                animation: (isPaused && !isSpeaking) ? 'none' : `wave 1s ease-in-out infinite ${i * 0.12}s`
                            }}
                        />
                    ))}
                </div>
            )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6 mb-12">
            {(isRecording || isSpeaking) && (
                <Button
                    variant="outline"
                    size="icon"
                    onClick={isSpeaking ? () => window.speechSynthesis.cancel() : togglePause}
                    className="w-20 h-20 rounded-full border-gray-200 bg-white hover:bg-gray-50 text-gray-700 shadow-lg"
                >
                    {isSpeaking ? <Square className="w-8 h-8 text-red-500 fill-current" /> : isPaused ? <Play className="w-8 h-8 fill-current text-blue-600" /> : <Pause className="w-8 h-8 fill-current text-blue-600" />}
                </Button>
            )}

            <Button
                size="lg"
                onClick={toggleRecording}
                disabled={isProcessing}
                className={`h-20 w-20 rounded-full shadow-2xl transition-all duration-300 ${
                    isRecording 
                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                } ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
                {isRecording ? <Square className="w-8 h-8 fill-current" /> : <Mic className="w-10 h-10" />}
            </Button>
        </div>

        {/* Footer Info */}
        <div className="text-center">
            <p className="text-[10px] text-gray-400 uppercase tracking-[0.2em] font-bold">
                Lumen Station V1.0 • Powered by Innovatec
            </p>
        </div>
      </main>

      <style>{`
        @keyframes wave {
          0%, 100% { height: 8px; }
          50% { height: 32px; }
        }
      `}</style>
    </div>
  );
}
