import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Textarea } from "../components/ui/textarea";
import {
  Send,
  Sparkles,
  LogOut,
  User,
  Lightbulb,
} from "lucide-react";
import ChatMessage from "../components/ChatMessage";
import WelcomeScreen from "../components/WelcomeScreen";
import { useAuth } from "@/app/context/AuthContext";

// Mock data para documentos y respuestas
const mockResponses = [
  {
    question: "¿Cuál es la tolerancia máxima de presión de la válvula modelo T-500?",
    answer:
      "Según el Manual de Mantenimiento Industrial 2023, la válvula modelo T-500 tiene una tolerancia máxima de presión de 150 PSI a temperatura ambiente (20°C). Es importante no exceder este límite para evitar daños estructurales y garantizar la seguridad operativa.",
    sources: [
      {
        document: "Manual_Mantenimiento_Industrial_2023.pdf",
        page: 42,
        snippet:
          "La válvula T-500 está diseñada con una tolerancia máxima de 150 PSI...",
      },
    ],
  },
  {
    question: "¿Cuántos días de vacaciones corresponden a un empleado con 5 años de antigüedad?",
    answer:
      "De acuerdo con el Reglamento Interno de Recursos Humanos, un empleado con 5 años de antigüedad tiene derecho a 20 días hábiles de vacaciones pagadas por año calendario. Además, puede acumular hasta 5 días adicionales del año anterior.",
    sources: [
      {
        document: "Reglamento_RRHH_2024.pdf",
        page: 18,
        snippet:
          "Empleados con antigüedad entre 5-10 años: 20 días hábiles de vacaciones...",
      },
    ],
  },
  {
    question: "¿Qué documentos necesito para solicitar un reembolso de gastos?",
    answer:
      "Para solicitar un reembolso de gastos, necesitas: 1) Formato de solicitud de reembolso firmado por tu supervisor, 2) Facturas originales o comprobantes fiscales, 3) Justificación del gasto relacionado con actividades laborales, y 4) Cuenta bancaria CLABE activa. El proceso tarda de 5 a 7 días hábiles.",
    sources: [
      {
        document: "Manual_Finanzas_Procedimientos.pdf",
        page: 67,
        snippet:
          "Documentación requerida para reembolsos: formato autorizado, facturas originales...",
      },
      {
        document: "Políticas_Corporativas_2025.pdf",
        page: 23,
        snippet: "Tiempos de procesamiento: reembolsos 5-7 días hábiles...",
      },
    ],
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [query, setQuery] = useState("");
  const [messages, setMessages] = useState<
    Array<{
      type: "user" | "assistant";
      content: string;
      sources?: Array<{ document: string; page: number; snippet: string }>;
      timestamp: Date;
    }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    // Add user message
    const userMessage = {
      type: "user" as const,
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Simulate AI processing
    setTimeout(() => {
      // Find a relevant mock response or use a generic one
      const mockResponse =
        mockResponses.find((r) =>
          query.toLowerCase().includes(r.question.toLowerCase().split(" ")[1])
        ) || mockResponses[0];

      const assistantMessage = {
        type: "assistant" as const,
        content: mockResponse.answer,
        sources: mockResponse.sources,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsLoading(false);
      setQuery("");
    }, 1500);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lumen</h1>
              <p className="text-xs text-gray-500">Asistente de Conocimiento</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center gap-2 px-3 py-2 bg-gray-50 rounded-lg border border-gray-200">
              <User className="w-4 h-4 text-gray-600" />
              <span className="text-sm text-gray-700 font-medium">{user?.name ?? 'Usuario'}</span>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline ml-2">Salir</span>
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 flex flex-col">
        {messages.length === 0 ? (
          <WelcomeScreen onExampleClick={handleExampleQuery} />
        ) : (
          <div className="flex-1 overflow-y-auto bg-gray-50">
            <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
              {messages.map((message, index) => (
                <ChatMessage key={index} message={message} />
              ))}
              {isLoading && (
                <div className="flex items-start gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600 flex-shrink-0">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                  </div>
                  <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-cyan-600">
                      <div className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce" />
                      <div
                        className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      />
                      <div
                        className="w-2 h-2 bg-cyan-600 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      />
                      <span className="ml-2 text-sm font-medium">Analizando documentos...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white shadow-lg">
          <div className="max-w-4xl mx-auto px-4 py-5">
            <form onSubmit={handleSubmit} className="relative">
              <Textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Pregunta lo que necesites saber..."
                className="min-h-[100px] pr-14 bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 resize-none rounded-xl"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
              />
              <Button
                type="submit"
                size="icon"
                disabled={!query.trim() || isLoading}
                className="absolute bottom-3 right-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white disabled:opacity-50 disabled:cursor-not-allowed shadow-md"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
            <p className="text-xs text-gray-500 mt-3 text-center">
              Respuestas basadas únicamente en documentos corporativos verificados
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}