import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Settings,
  Upload,
  FileText,
  Paperclip,
  Send,
  ExternalLink,
  RotateCcw,
  CheckCircle2,
  FileCheck,
  AlertTriangle,
  FileDown,
  Plus,
  Sparkles,
  MessageSquare,
  User,
  ChevronLeft,
  ChevronRight,
  Minimize2,
  Maximize2,
  Search,
  Trash2,
  X,
  Clock,
  Filter,
  Download,
} from "lucide-react";
import { Progress } from "../components/ui/progress";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";

// Types for API integration
interface Document {
  id: string;
  name: string;
  status: "indexed" | "processing" | "queued";
  uploadedAt?: Date;
  area?: string;
  size?: string;
}

interface Citation {
  title: string;
  subtitle: string;
  documentId?: string;
  pageNumber?: number;
}

interface Message {
  id: string;
  type: "user" | "assistant";
  content: string;
  timestamp: Date;
  citation?: Citation;
}

interface KnowledgeGap {
  coverage: number;
  indexed: number;
  gaps: number;
}

interface ChatHistory {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: Date;
  messageCount: number;
}

interface FrequentTopic {
  topic: string;
  queries: number;
  coverage: "high" | "medium" | "low";
}

const KNOWLEDGE_AREAS = [
  "RRHH",
  "Finanzas",
  "Técnico",
  "Calidad",
  "Seguridad",
  "Operaciones",
  "Legal",
  "Comercial",
] as const;

export default function MainDashboard() {
  const navigate = useNavigate();
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [ocrProgress, setOcrProgress] = useState(0);
  const [knowledgeGap, setKnowledgeGap] = useState<KnowledgeGap>({
    coverage: 0,
    indexed: 0,
    gaps: 0,
  });

  // Panel visibility states
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);
  const [isRightPanelCollapsed, setIsRightPanelCollapsed] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: chatInput,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

    // TODO: Replace with actual API call
    // const response = await fetch('/api/chat', {
    //   method: 'POST',
    //   body: JSON.stringify({ message: chatInput, sessionId: 'xxx' })
    // });
    // const data = await response.json();
    
    setIsLoading(false);
  };

  const handleFileUpload = async (files: FileList | null) => {
    if (!files) return;

    // TODO: Replace with actual API call
    // const formData = new FormData();
    // Array.from(files).forEach(file => formData.append('files', file));
    // const response = await fetch('/api/documents/upload', {
    //   method: 'POST',
    //   body: formData
    // });
    // const uploadedDocs = await response.json();
    // setDocuments(prev => [...prev, ...uploadedDocs]);
  };

  const handleGenerateDeliverable = async (type: string) => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/deliverables/generate', {
    //   method: 'POST',
    //   body: JSON.stringify({ type, sessionId: 'xxx' })
    // });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between gap-4">
            {/* Logo */}
            <div className="flex items-center gap-8">
              <h1 className="text-2xl font-bold text-gray-900">LUMEN</h1>
            </div>

            {/* Navigation & Actions */}
            <div className="flex items-center gap-6">
              <nav className="hidden md:flex items-center gap-1">
                <Button
                  variant="ghost"
                  className="text-gray-900 font-semibold border-b-2 border-blue-600 rounded-none px-4"
                >
                  Dashboard
                </Button>
              </nav>

              <div className="flex items-center gap-2">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - 3 Resizable Columns */}
      <main className="flex-1 p-6 overflow-hidden">
        <ResizablePanelGroup direction="horizontal" className="h-full gap-6">
          {/* Left Panel - Knowledge Sources */}
          {!isLeftPanelCollapsed && (
            <>
              <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                <div className="h-full overflow-y-auto pr-3 space-y-6">
                  {/* Upload Section */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-bold text-gray-900">
                        Fuentes de Conocimiento
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsLeftPanelCollapsed(true)}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mb-6 uppercase tracking-wide">
                      Knowledge Ingestion
                    </p>

                    <label htmlFor="file-upload" className="cursor-pointer">
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-cyan-400 hover:bg-cyan-50/30 transition-colors">
                        <Upload className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                        <p className="font-semibold text-gray-700 mb-1">
                          Cargar Archivos
                        </p>
                        <p className="text-xs text-gray-500">
                          Drag & Drop PDF, DOCX, XLSX
                        </p>
                      </div>
                      <input
                        id="file-upload"
                        type="file"
                        multiple
                        accept=".pdf,.docx,.xlsx,.doc,.xls"
                        className="hidden"
                        onChange={(e) => handleFileUpload(e.target.files)}
                      />
                    </label>

                    {/* OCR Processing */}
                    {ocrProgress > 0 && (
                      <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600 font-medium">
                            OCR Processing Status
                          </span>
                          <span className="text-sm font-bold text-gray-900">
                            {ocrProgress}%
                          </span>
                        </div>
                        <Progress value={ocrProgress} className="h-2" />
                      </div>
                    )}
                  </div>

                  {/* Active Files */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Archivos Activos
                    </h3>

                    {documents.length === 0 ? (
                      <div className="text-center py-8">
                        <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-sm text-gray-500">
                          No hay documentos cargados
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          Sube archivos para comenzar
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {documents.map((doc) => (
                          <div
                            key={doc.id}
                            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
                              <FileText className="w-5 h-5 text-gray-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate">
                                {doc.name}
                              </p>
                              <p className="text-xs text-gray-500 uppercase">
                                {doc.status === "indexed"
                                  ? "Indexed"
                                  : doc.status === "processing"
                                  ? "Processing..."
                                  : "Queued"}
                              </p>
                            </div>
                            {doc.status === "indexed" ? (
                              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            ) : doc.status === "processing" ? (
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse" />
                            ) : null}
                          </div>
                        ))}
                      </div>
                    )}

                    <Button className="w-full mt-4 bg-blue-900 hover:bg-blue-800 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Nueva Fuente
                    </Button>
                  </div>
                </div>
              </ResizablePanel>

              <ResizableHandle withHandle className="bg-gray-200 hover:bg-blue-400 transition-colors" />
            </>
          )}

          {/* Collapsed Left Panel Toggle */}
          {isLeftPanelCollapsed && (
            <div className="flex items-start pt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsLeftPanelCollapsed(false)}
                className="h-10 w-10 rounded-r-lg rounded-l-none border-l-0"
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          )}

          {/* Center Panel - Chat */}
          <ResizablePanel defaultSize={50} minSize={30}>
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full">
              {/* Chat Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <h2 className="text-2xl font-bold text-gray-900">LUMEN Chat</h2>
                <p className="text-sm text-gray-500">
                  Technical Assistant AI Layer
                </p>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center max-w-md">
                      <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-6 shadow-lg">
                        <MessageSquare className="w-10 h-10 text-white" />
                      </div>
                      <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        Bienvenido a LUMEN
                      </h3>
                      <p className="text-gray-600 mb-6">
                        Comienza la conversación preguntando sobre tus documentos corporativos. La IA te responderá con información precisa y trazable.
                      </p>
                      <div className="space-y-2 text-left bg-gray-50 rounded-xl p-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">
                          Ejemplos de consultas:
                        </p>
                        <p className="text-xs text-gray-600">
                          • ¿Cuál es el procedimiento de seguridad?
                        </p>
                        <p className="text-xs text-gray-600">
                          • Resume el manual de operaciones
                        </p>
                        <p className="text-xs text-gray-600">
                          • ¿Qué dice la normativa sobre...?
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {messages.map((message) => (
                      <div key={message.id}>
                        {message.type === "assistant" ? (
                          <div className="flex items-start gap-4">
                            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 flex-shrink-0">
                              <Sparkles className="w-5 h-5 text-white" />
                            </div>
                            <div className="flex-1 space-y-3">
                              <div className="bg-gray-50 rounded-2xl p-5">
                                <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-line">
                                  {message.content}
                                </p>
                              </div>

                              {message.citation && (
                                <button className="flex items-center gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl hover:bg-blue-100 transition-colors w-full text-left group">
                                  <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg flex-shrink-0 border border-blue-200">
                                    <FileText className="w-5 h-5 text-blue-600" />
                                  </div>
                                  <div className="flex-1">
                                    <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">
                                      Cita Relacionada
                                    </p>
                                    <p className="text-sm font-semibold text-gray-900 group-hover:text-blue-600">
                                      {message.citation.title}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                      {message.citation.subtitle}
                                    </p>
                                  </div>
                                  <ExternalLink className="w-5 h-5 text-blue-600" />
                                </button>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                              >
                                <RotateCcw className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-gray-400 hover:text-gray-600"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-4 justify-end">
                            <div className="bg-blue-100 rounded-2xl px-5 py-3 max-w-md">
                              <p className="text-sm text-gray-900">
                                {message.content}
                              </p>
                              <p className="text-xs text-gray-500 mt-2 text-right">
                                {message.timestamp.toLocaleTimeString("es-ES", {
                                  hour: "2-digit",
                                  minute: "2-digit",
                                })}
                              </p>
                            </div>
                            <button className="flex items-center justify-center w-8 h-8 bg-gray-200 rounded-full hover:bg-gray-300 transition-colors">
                              <User className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-blue-600 flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-white animate-pulse" />
                        </div>
                        <div className="flex-1 bg-gray-50 rounded-2xl p-5">
                          <div className="flex items-center gap-2 text-blue-600">
                            <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                            <div
                              className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.4s" }}
                            />
                            <span className="ml-2 text-sm font-medium">
                              Analizando documentos...
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-4">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Escribe tu consulta técnica aquí..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-gray-50 border-gray-200"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!chatInput.trim() || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
                <p className="text-xs text-gray-400 text-center mt-2">
                  POWERED BY INNOVATEC RAG-ENGINE V2.4
                </p>
              </div>
            </div>
          </ResizablePanel>

          {!isRightPanelCollapsed && (
            <>
              <ResizableHandle withHandle className="bg-gray-200 hover:bg-blue-400 transition-colors" />

              {/* Right Panel - Innovation Studio */}
              <ResizablePanel defaultSize={25} minSize={15} maxSize={40}>
                <div className="h-full overflow-y-auto pl-3 space-y-6">
                  {/* Knowledge Gaps */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-1">
                      <h2 className="text-lg font-bold text-gray-900">
                        Studio de Innovación
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setIsRightPanelCollapsed(true)}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mb-6 uppercase tracking-wide">
                      Analysis & Deliverables
                    </p>

                    <div className="space-y-4">
                      <h3 className="text-sm font-bold text-gray-900">
                        Brechas de Conocimiento
                      </h3>

                      {/* Circular Chart */}
                      <div className="flex flex-col items-center py-6">
                        <div className="relative w-40 h-40">
                          <svg className="w-40 h-40 transform -rotate-90">
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="#e5e7eb"
                              strokeWidth="12"
                              fill="none"
                            />
                            <circle
                              cx="80"
                              cy="80"
                              r="70"
                              stroke="#1e3a8a"
                              strokeWidth="12"
                              fill="none"
                              strokeDasharray="440"
                              strokeDashoffset={
                                440 - (440 * knowledgeGap.coverage) / 100
                              }
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-4xl font-bold text-blue-900">
                              {knowledgeGap.coverage}%
                            </span>
                            <span className="text-xs text-gray-500 uppercase">
                              Cobertura
                            </span>
                          </div>
                        </div>

                        <div className="w-full mt-6 space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-blue-900 rounded-full"></div>
                              <span className="text-gray-600">
                                Conocimiento Indexado
                              </span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {knowledgeGap.indexed}%
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-3 h-3 bg-gray-300 rounded-full"></div>
                              <span className="text-gray-600">
                                Brechas de Información
                              </span>
                            </div>
                            <span className="font-semibold text-gray-900">
                              {knowledgeGap.gaps}%
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Deliverables */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                    <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-4">
                      Generar Entregables
                    </h3>

                    <div className="space-y-3">
                      <button
                        onClick={() => handleGenerateDeliverable("checklist")}
                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full text-left group border border-gray-200"
                      >
                        <div className="flex items-center justify-center w-12 h-12 bg-emerald-100 rounded-lg flex-shrink-0">
                          <FileCheck className="w-6 h-6 text-emerald-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            Generar Checklist de Seguridad
                          </p>
                          <p className="text-xs text-gray-600">
                            Basado en normas ISO 2024
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleGenerateDeliverable("incident")}
                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition-colors w-full text-left group border border-gray-200"
                      >
                        <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-lg flex-shrink-0">
                          <AlertTriangle className="w-6 h-6 text-red-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            Crear Reporte de Incidente
                          </p>
                          <p className="text-xs text-gray-600">
                            Formato industrial estandarizado
                          </p>
                        </div>
                      </button>

                      <button
                        onClick={() => handleGenerateDeliverable("export")}
                        className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-colors w-full text-left group border border-gray-200"
                      >
                        <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg flex-shrink-0">
                          <FileDown className="w-6 h-6 text-blue-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-900">
                            Exportar Resumen a PDF
                          </p>
                          <p className="text-xs text-gray-600">
                            Síntesis ejecutiva de proyecto
                          </p>
                        </div>
                      </button>
                    </div>
                  </div>

                  {/* Innovation Tip - Only show when there's data */}
                  {documents.length > 0 && (
                    <div className="bg-gradient-to-br from-blue-900 to-blue-800 rounded-xl p-6 text-white shadow-md">
                      <h3 className="text-sm font-bold mb-2">Tip de Innovación</h3>
                      <p className="text-xs leading-relaxed opacity-90">
                        Sube más documentos para mejorar la precisión de las respuestas y aumentar la cobertura de conocimiento.
                      </p>
                    </div>
                  )}
                </div>
              </ResizablePanel>
            </>
          )}

          {/* Collapsed Right Panel Toggle */}
          {isRightPanelCollapsed && (
            <div className="flex items-start pt-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsRightPanelCollapsed(false)}
                className="h-10 w-10 rounded-l-lg rounded-r-none border-r-0"
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
            </div>
          )}
        </ResizablePanelGroup>
      </main>
    </div>
  );
}