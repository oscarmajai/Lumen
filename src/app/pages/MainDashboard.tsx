import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router";
import { useAuth } from "@/app/context/AuthContext";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Mic,
  Upload,
  FileText,
  Paperclip,
  Send,
  ExternalLink,
  Plus,
  Sparkles,
  MessageSquare,
  User,
  Search,
  Trash2,
  Menu,
  Database,
  ChevronRight,
  Loader2,
  Clock3,
  CheckCircle,
  AlertCircle,
  X as XIcon,
  LogOut,
} from "lucide-react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "../components/ui/resizable";
import { ImperativePanelHandle } from "react-resizable-panels";
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
import { ScrollArea } from "../components/ui/scroll-area";
import { toast } from "sonner";
import {
  chat as chatApi, getDocuments, uploadFile, getIndexStatus, getAreas, Area,
  getChatSessions, getChatMessages, deleteChatSession, ChatSession,
} from "@/lib/api";

// Types for API integration
interface Document {
  id: string;
  name: string;
  technicalStatus: 'uploading' | 'queued' | 'indexing' | 'completed' | 'error' | 'paused' | string;
  progress: number; // 0-100
  uploadedAt: Date;
  area: string;
  size: string;
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

// Re-use ChatSession from api — just alias it locally
type ChatHistory = ChatSession;

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

function relativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
}

export default function MainDashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const [chatInput, setChatInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [employeeAreas, setEmployeeAreas] = useState<Area[]>([]);
  const pollingRefs = useRef<Map<string, number>>(new Map());
  const isMountedRef = useRef<boolean>(false);
  const [isLoading, setIsLoading] = useState(false);

  // Chat history features
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [selectedArea, setSelectedArea] = useState<string>("");
  const [pendingFiles, setPendingFiles] = useState<FileList | null>(null);
  const [showHistorySidebar, setShowHistorySidebar] = useState(true);
  const [documentFilter, setDocumentFilter] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [chatHistorySearch, setChatHistorySearch] = useState("");
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);

  // Mobile responsive states
  const [mobileActiveTab, setMobileActiveTab] = useState<"historial" | "fuentes" | "chat">("chat");

  // Panel visibility states
  const [isLeftPanelCollapsed, setIsLeftPanelCollapsed] = useState(false);

  // Panel refs for imperative control
  const leftPanelRef = useRef<ImperativePanelHandle>(null);

  // Helpers
  const formatBytes = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return "";
    if (bytes === 0) return '0 Bytes';
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / Math.pow(1024, i)).toFixed(2)} ${sizes[i]}`;
  };

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  function startPolling(documentId: string) {
    if (pollingRefs.current.has(documentId)) return; // already polling
    const intervalId = window.setInterval(async () => {
      try {
        const s = await getIndexStatus(documentId);
        if (!isMountedRef.current) return;
        setDocuments((prev) =>
          prev.map((d) =>
            d.id === (s.id || documentId)
              ? {
                  ...d,
                  technicalStatus: s.technicalStatus || d.technicalStatus,
                  progress: typeof s.percent === 'number' ? s.percent : d.progress,
                }
              : d
          )
        );
        const terminal = s.technicalStatus === 'completed' || s.technicalStatus === 'error';
        if (terminal) {
          const id = pollingRefs.current.get(documentId);
          if (id) {
            clearInterval(id);
            pollingRefs.current.delete(documentId);
          }
        }
      } catch (e) {
        // network error: keep polling, UI shouldn't collapse
      }
    }, 2500);
    pollingRefs.current.set(documentId, intervalId);
  }

  async function refreshDocuments() {
    try {
      const items = await getDocuments();
      const mapped = items.map((d) => {
        const raw = (d.status || '').toLowerCase();
        const technicalStatus: Document['technicalStatus'] = raw.includes('complete') || raw.includes('indexed')
          ? 'completed'
          : raw.includes('queue')
            ? 'queued'
            : raw || 'indexing';
        const progress = technicalStatus === 'completed' ? 100 : technicalStatus === 'queued' ? 5 : 0;
        return {
          id: d.id,
          name: d.name,
          technicalStatus,
          progress,
          uploadedAt: d.created_at ? new Date(d.created_at) : new Date(),
          area: 'General',
          size: formatBytes(d.size) || '',
        } as Document;
      });
      setDocuments(mapped);
      // start polling for any non-terminal docs
      mapped.forEach(doc => {
        if (doc.technicalStatus !== 'completed' && doc.technicalStatus !== 'error' && doc.technicalStatus !== 'paused') {
          startPolling(doc.id);
        }
      });
    } catch (err: any) {
      toast.error('No se pudo cargar la lista de documentos', { description: err?.message });
    }
  }

  const refreshSessions = async () => {
    try {
      const sessions = await getChatSessions();
      setChatHistory(sessions);
    } catch (err: any) {
      toast.error('No se pudo cargar el historial', { description: err?.message });
    }
  };

  useEffect(() => {
    isMountedRef.current = true;
    refreshSessions();
    if (user?.role === 'EMPLOYEE') {
      getAreas().then(setEmployeeAreas).catch(() => {});
    } else {
      refreshDocuments();
    }
    return () => {
      isMountedRef.current = false;
      pollingRefs.current.forEach((id) => clearInterval(id));
      pollingRefs.current.clear();
    };
  }, [user?.role]);

  // Drag & Drop handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      setPendingFiles(files);
      setShowUploadDialog(true);
    }
  };

  const handleFileSelect = (files: FileList | null) => {
    if (files && files.length > 0) {
      setPendingFiles(files);
      setShowUploadDialog(true);
    }
  };

  function upsertDocument(next: Document) {
    setDocuments((prev) => {
      const exists = prev.some((d) => d.id === next.id);
      return exists ? prev.map((d) => (d.id === next.id ? next : d)) : [next, ...prev];
    });
  }

  const confirmUpload = async () => {
    if (!pendingFiles || !selectedArea) return;

    const fileCount = pendingFiles.length;
    toast.info(
      `Subiendo ${fileCount} archivo${fileCount > 1 ? "s" : ""} al área ${selectedArea}`,
      { description: "Procesando e indexando en la base de conocimiento..." }
    );

    try {
      for (let i = 0; i < pendingFiles.length; i++) {
        const file = pendingFiles[i];
        const tempId = `temp-${Date.now()}-${i}`;
        // 1) Añadir documento temporal en estado uploading
        upsertDocument({
          id: tempId,
          name: file.name,
          technicalStatus: 'uploading',
          progress: 0,
          uploadedAt: new Date(),
          area: selectedArea,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        } as unknown as Document);

        try {
          // 2) Subir archivo
          const result = await uploadFile(file);
          toast.success(`Archivo subido: ${file.name}`, { description: `Documento ID: ${result.document_id}` });

          // 3) Reemplazar temporal por doc real en estado queued y comenzar polling
          setDocuments((prev) => prev.filter((d) => d.id !== tempId));
          upsertDocument({
            id: result.document_id,
            name: file.name,
            technicalStatus: 'queued',
            progress: 5,
            uploadedAt: new Date(),
            area: selectedArea,
            size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          } as unknown as Document);

          startPolling(result.document_id);
        } catch (err: any) {
          // 4) Marcar temporal como error
          setDocuments((prev) =>
            prev.map((d) =>
              d.id === tempId ? { ...d, technicalStatus: 'error', progress: 0 } : d
            )
          );
          toast.error(`Error subiendo ${file.name}`, { description: err?.message });
        }
      }
    } catch (e: any) {
      toast.error('Error durante la subida', { description: e?.message });
    } finally {
      setShowUploadDialog(false);
      setPendingFiles(null);
      setSelectedArea("");
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || isLoading) return;

    const text = chatInput;

    const userMessage: Message = {
      id: Date.now().toString(),
      type: "user",
      content: text,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setChatInput("");
    setIsLoading(true);

    try {
      const isNewSession = !currentChatId;
      const res = await chatApi(text, currentChatId ?? undefined);
      const assistantMessage: Message = {
        id: `${Date.now()}-assistant`,
        type: 'assistant',
        content: res.answer || '',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, assistantMessage]);
      if (res.session_id) setCurrentChatId(res.session_id);
      if (isNewSession) refreshSessions();
    } catch (err: any) {
      toast.error('Error enviando el mensaje', { description: err?.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDeliverable = async (type: string) => {
    const deliverableNames: Record<string, string> = {
      checklist: "Checklist de Seguridad",
      incident: "Reporte de Incidente",
      export: "Exportación a PDF"
    };
    
    toast.info(`Generando ${deliverableNames[type] || type}...`, {
      description: "Esta acción requiere conexión con el backend RAG"
    });
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentChatId(null);
    setChatInput("");
  };

  const loadChatHistory = async (chatId: string) => {
    if (chatId === currentChatId) return;
    try {
      const msgs = await getChatMessages(chatId);
      setMessages(msgs.map(m => ({
        id: m.id,
        type: m.role === 'user' ? 'user' as const : 'assistant' as const,
        content: m.content,
        timestamp: new Date(m.created_at),
      })));
      setCurrentChatId(chatId);
    } catch (err: any) {
      toast.error('No se pudo cargar la conversación', { description: err?.message });
    }
  };

  const deleteChatFromHistory = async (chatId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteChatSession(chatId);
      setChatHistory(prev => prev.filter(c => c.id !== chatId));
      if (currentChatId === chatId) {
        setMessages([]);
        setCurrentChatId(null);
      }
      toast.success('Conversación eliminada');
    } catch (err: any) {
      toast.error('Error al eliminar', { description: err?.message });
    }
  };

  const deleteDocument = (docId: string, docName: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== docId));
    toast.success("Documento eliminado", {
      description: docName
    });
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(documentFilter.toLowerCase())
  );

  const filteredChatHistory = chatHistory.filter((chat) =>
    !chatHistorySearch.trim() || chat.title.toLowerCase().includes(chatHistorySearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Chat History Sidebar - DESKTOP */}
      {showHistorySidebar && (
        <div className="hidden md:flex w-64 bg-white border-r border-gray-200 flex-col">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900">Historial</h2>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => setShowHistorySidebar(false)}
              >
                <Menu className="w-4 h-4" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input 
                placeholder="Buscar chats..." 
                className="pl-9 h-9 text-sm"
                value={chatHistorySearch}
                onChange={(e) => setChatHistorySearch(e.target.value)}
              />
            </div>
          </div>

          <ScrollArea className="flex-1 p-3">
            {chatHistory.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No hay conversaciones</p>
                <p className="text-xs text-gray-400 mt-1">Inicia un chat nuevo</p>
              </div>
            ) : (
              <div className="space-y-1">
                {filteredChatHistory.map((chat) => (
                  <div
                    key={chat.id}
                    className={`group relative flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                      chat.id === currentChatId
                        ? 'bg-blue-50 border border-blue-200'
                        : 'hover:bg-gray-50 border border-transparent'
                    }`}
                    onClick={() => loadChatHistory(chat.id)}
                  >
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${chat.id === currentChatId ? 'text-blue-900' : 'text-gray-900'}`}>
                        {chat.title}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {relativeTime(chat.updated_at)}
                      </p>
                    </div>
                    <button
                      onClick={(e) => deleteChatFromHistory(chat.id, e)}
                      className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all mt-0.5"
                      title="Eliminar conversación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          <div className="p-3 border-t border-gray-200">
            <Button 
              onClick={handleNewChat}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Plus className="w-4 h-4 mr-2" />
              Nuevo Chat
            </Button>
          </div>
        </div>
      )}

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                {!showHistorySidebar && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowHistorySidebar(true)}
                    className="text-gray-600"
                  >
                    <Menu className="w-5 h-5" />
                  </Button>
                )}
                <h1 className="text-2xl font-bold text-gray-900">LUMEN</h1>
              </div>

              <div className="flex items-center gap-6">
                <nav className="hidden md:flex items-center gap-2">
                  <Button
                    variant="ghost"
                    className="text-gray-900 font-semibold border-b-2 border-blue-600 rounded-none px-4 flex items-center gap-2"
                  >
                    <MessageSquare className="w-4 h-4" />
                    Lumen Chat
                  </Button>
                  <Button
                    variant="ghost"
                    className="text-gray-500 hover:text-blue-600 font-medium px-4 flex items-center gap-2"
                    onClick={() => navigate("/lumen-station")}
                  >
                    <Mic className="w-4 h-4" />
                    Lumen Station
                  </Button>
                  {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
                    <Button
                      variant="ghost"
                      className="text-gray-500 hover:text-blue-600 font-medium px-4 flex items-center gap-2"
                      onClick={() => navigate("/admin")}
                    >
                      <Database className="w-4 h-4" />
                      Panel Admin
                    </Button>
                  )}
                </nav>

                <div className="flex items-center gap-3">
                  {user && (
                    <span className="hidden md:block text-sm text-gray-600 font-medium">
                      {user.name}
                    </span>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-gray-600 hover:text-red-600 hover:bg-red-50"
                    onClick={handleLogout}
                    title="Cerrar sesión"
                  >
                    <LogOut className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content - 3 Resizable Columns */}
        <main className="flex-1 p-2 md:p-6 overflow-hidden pb-20 md:pb-6">
          {/* MOBILE VIEW: Tabs with bottom navigation */}
          <div className="h-full md:hidden">
            {/* Tab Content Container */}
            <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
              
              {/* HISTORIAL TAB */}
              {mobileActiveTab === "historial" && (
                <>
                  <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0 flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-bold text-gray-900">Historial</h2>
                      <p className="text-xs text-gray-500">Tus conversaciones anteriores</p>
                    </div>
                    <Button
                      size="sm"
                      onClick={handleNewChat}
                      className="bg-blue-600 hover:bg-blue-700 text-white h-8 text-xs"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Nuevo
                    </Button>
                  </div>
                  <div className="px-3 pt-3 flex-shrink-0">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <Input
                        placeholder="Buscar chats..."
                        className="pl-9 h-9 text-sm"
                        value={chatHistorySearch}
                        onChange={(e) => setChatHistorySearch(e.target.value)}
                      />
                    </div>
                  </div>
                  <ScrollArea className="flex-1 p-3">
                    {chatHistory.length === 0 ? (
                      <div className="text-center py-8 px-4">
                        <MessageSquare className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                        <p className="text-sm text-gray-500">No hay conversaciones</p>
                        <p className="text-xs text-gray-400 mt-1">Inicia un chat nuevo</p>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {filteredChatHistory.map((chat) => (
                          <div
                            key={chat.id}
                            className={`group relative flex items-start gap-2 p-3 rounded-lg cursor-pointer transition-colors ${
                              chat.id === currentChatId
                                ? 'bg-blue-50 border border-blue-200'
                                : 'hover:bg-gray-50 border border-transparent'
                            }`}
                            onClick={() => {
                              loadChatHistory(chat.id);
                              setMobileActiveTab("chat");
                            }}
                          >
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${chat.id === currentChatId ? 'text-blue-900' : 'text-gray-900'}`}>
                                {chat.title}
                              </p>
                              <p className="text-xs text-gray-400 mt-0.5">
                                {relativeTime(chat.updated_at)}
                              </p>
                            </div>
                            <button
                              onClick={(e) => deleteChatFromHistory(chat.id, e)}
                              className="opacity-0 group-hover:opacity-100 flex-shrink-0 p-1 rounded hover:bg-red-50 hover:text-red-500 text-gray-400 transition-all mt-0.5"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}

              {/* FUENTES TAB */}
              {mobileActiveTab === "fuentes" && (
                <>
                  <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">
                      {user?.role === 'EMPLOYEE' ? 'Mis Áreas' : 'Fuentes de Conocimiento'}
                    </h2>
                    <p className="text-xs text-gray-500">
                      {user?.role === 'EMPLOYEE' ? 'Áreas de conocimiento asignadas' : 'Gestiona tus documentos corporativos'}
                    </p>
                  </div>

                  <ScrollArea className="flex-1 p-4">
                    {user?.role === 'EMPLOYEE' ? (
                      <div className="space-y-3">
                        {employeeAreas.length === 0 ? (
                          <div className="text-center py-8">
                            <Database className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                            <p className="text-sm text-gray-500">Sin áreas asignadas</p>
                            <p className="text-xs text-gray-400 mt-1">Contacta a tu administrador</p>
                          </div>
                        ) : (
                          employeeAreas.map((area) => (
                            <div key={area.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-cyan-50 rounded-lg">
                                  <Database size={14} className="text-cyan-600" />
                                </div>
                                <span className="text-sm font-bold text-gray-800 truncate flex-1">{area.name}</span>
                              </div>
                              {area.description && (
                                <p className="text-xs text-gray-500 line-clamp-2 pl-1">{area.description}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <label htmlFor="file-upload-mobile-tab" className="cursor-pointer block">
                          <div className="border-2 border-dashed rounded-lg p-6 text-center transition-all border-gray-300 active:border-cyan-400 active:bg-cyan-50/30">
                            <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                            <p className="text-sm font-semibold text-gray-700">Cargar Archivos</p>
                            <p className="text-xs text-gray-500">PDF, DOCX, XLSX</p>
                          </div>
                          <input
                            id="file-upload-mobile-tab"
                            type="file"
                            multiple
                            accept=".pdf,.docx,.xlsx,.doc,.xls"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                          />
                        </label>

                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                            Archivos ({documents.length})
                          </h3>
                          {filteredDocuments.length === 0 ? (
                            <div className="text-center py-8">
                              <FileText className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                              <p className="text-sm text-gray-500">Sin documentos</p>
                              <p className="text-xs text-gray-400 mt-1">Carga documentos para comenzar</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {filteredDocuments.map((doc) => (
                                <div key={doc.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 border border-gray-200">
                                  <FileText className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{doc.name}</p>
                                    <p className="text-xs text-gray-500">{doc.area}</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </>
              )}

              {/* CHAT TAB */}
              {mobileActiveTab === "chat" && (
                <>
                  {/* Chat Header */}
                  <div className="border-b border-gray-200 px-4 py-3 flex-shrink-0">
                    <h2 className="text-lg font-bold text-gray-900">LUMEN Chat</h2>
                    <p className="text-xs text-gray-500">Technical Assistant AI Layer</p>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto px-4 py-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center max-w-sm px-4">
                      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg">
                        <MessageSquare className="w-8 h-8 text-white" />
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2">
                        Bienvenido a LUMEN
                      </h3>
                      <p className="text-sm text-gray-600 mb-4">
                        Pregunta sobre tus documentos corporativos
                      </p>
                      <div className="bg-gray-50 rounded-xl p-3 text-left">
                        <p className="text-xs font-semibold text-gray-700 mb-2">
                          Ejemplos:
                        </p>
                        <p className="text-xs text-gray-600">
                          • ¿Procedimiento de seguridad?
                        </p>
                        <p className="text-xs text-gray-600">
                          • Resume el manual de operaciones
                        </p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {messages.map((message) => (
                      <div key={message.id}>
                        {message.type === "assistant" ? (
                          <div className="flex items-start gap-2">
                            <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-blue-600 flex-shrink-0">
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="bg-gray-50 rounded-2xl p-3">
                                <p className="text-sm text-gray-800">
                                  {message.content}
                                </p>
                              </div>
                              {message.citation && (
                                <button className="flex items-center gap-2 p-2.5 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 mt-2 text-left w-full">
                                  <FileText className="w-4 h-4 text-blue-600" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs font-semibold text-gray-900 truncate">
                                      {message.citation.title}
                                    </p>
                                    <p className="text-xs text-gray-600 truncate">
                                      {message.citation.subtitle}
                                    </p>
                                  </div>
                                  <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                                </button>
                              )}
                            </div>
                          </div>
                        ) : (
                          <div className="flex items-start gap-2 justify-end">
                            <div className="bg-blue-100 rounded-2xl px-3 py-2 max-w-[80%]">
                              <p className="text-sm text-gray-900">
                                {message.content}
                              </p>
                            </div>
                            <div className="w-7 h-7 bg-gray-200 rounded-full flex items-center justify-center">
                              <User className="w-3.5 h-3.5 text-gray-600" />
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                          <Sparkles className="w-3.5 h-3.5 text-white animate-pulse" />
                        </div>
                        <div className="bg-gray-50 rounded-2xl p-3">
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce" />
                            <div
                              className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.2s" }}
                            />
                            <div
                              className="w-1.5 h-1.5 bg-blue-600 rounded-full animate-bounce"
                              style={{ animationDelay: "0.4s" }}
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-3 flex-shrink-0 safe-area-inset-bottom">
                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-gray-400 hover:text-gray-600 flex-shrink-0 h-10 w-10"
                  >
                    <Paperclip className="w-5 h-5" />
                  </Button>
                  <Input
                    type="text"
                    placeholder="Escribe tu consulta..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-gray-50 border-gray-200"
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    size="icon"
                    className="bg-blue-600 hover:bg-blue-700 flex-shrink-0 h-10 w-10"
                    disabled={!chatInput.trim() || isLoading}
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                  </form>
                  <p className="text-[10px] text-gray-400 text-center mt-1.5">
                    POWERED BY INNOVATEC RAG-ENGINE V2.4
                  </p>
                </div>
              </>
              )}
            </div>

            {/* Bottom Navigation Bar - Mobile */}
            <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-700 safe-area-inset-bottom md:hidden">
              <div className="flex items-center justify-around px-4 py-2">
                <button
                  onClick={() => setMobileActiveTab("historial")}
                  className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                    mobileActiveTab === "historial" ? "text-white" : "text-gray-400"
                  }`}
                >
                  <Clock3 className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Historial</span>
                </button>

                <button
                  onClick={() => setMobileActiveTab("chat")}
                  className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                    mobileActiveTab === "chat" ? "text-white" : "text-gray-400"
                  }`}
                >
                  <MessageSquare className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Chat</span>
                </button>

                <button
                  onClick={() => setMobileActiveTab("fuentes")}
                  className={`flex flex-col items-center justify-center py-2 px-4 rounded-lg transition-colors ${
                    mobileActiveTab === "fuentes" ? "text-white" : "text-gray-400"
                  }`}
                >
                  <FileText className="w-6 h-6 mb-1" />
                  <span className="text-xs font-medium">Fuentes</span>
                </button>
              </div>
            </div>
          </div>

          {/* DESKTOP VIEW: Resizable 3-panel layout */}
          <ResizablePanelGroup direction="horizontal" className="h-full gap-4 hidden md:flex">
            {/* Left Panel - Knowledge Sources */}
            <ResizablePanel
              id="left-panel"
              order={1}
              defaultSize={25}
              minSize={20}
              maxSize={40}
              collapsible={true}
              collapsedSize={3}
              ref={leftPanelRef}
              onCollapse={() => setIsLeftPanelCollapsed(true)}
              onExpand={() => setIsLeftPanelCollapsed(false)}
            >
              {!isLeftPanelCollapsed ? (
                <div className="h-full flex flex-col bg-white rounded-xl border border-gray-200 shadow-sm">
                  <div className="p-4 border-b border-gray-200">
                    <div className="flex items-center justify-between">
                      <h2 className="font-bold text-gray-900">
                        {user?.role === 'EMPLOYEE' ? 'Mis Áreas' : 'Fuentes'}
                      </h2>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => {
                          leftPanelRef.current?.collapse();
                          setIsLeftPanelCollapsed(true);
                        }}
                      >
                        <Menu className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  {user?.role === 'EMPLOYEE' ? (
                    /* Employee: show assigned areas */
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-3">
                        {employeeAreas.length === 0 ? (
                          <div className="text-center py-10">
                            <Database className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                            <p className="text-xs text-gray-500">Sin áreas asignadas</p>
                            <p className="text-[10px] text-gray-400 mt-1">Contacta a tu administrador</p>
                          </div>
                        ) : (
                          employeeAreas.map((area) => (
                            <div key={area.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-cyan-200 transition-colors">
                              <div className="flex items-center gap-2 mb-1">
                                <div className="p-1.5 bg-cyan-50 rounded-lg">
                                  <Database size={14} className="text-cyan-600" />
                                </div>
                                <span className="text-xs font-bold text-gray-800 truncate flex-1">{area.name}</span>
                              </div>
                              {area.description && (
                                <p className="text-[10px] text-gray-500 line-clamp-2 pl-1">{area.description}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </ScrollArea>
                  ) : (
                    /* Owner/Admin: upload + documents */
                    <ScrollArea className="flex-1 p-4">
                      <div className="space-y-4">
                        <label htmlFor="file-upload" className="cursor-pointer block group">
                          <div
                            onDragOver={handleDragOver}
                            onDragLeave={handleDragLeave}
                            onDrop={handleDrop}
                            className={`border-2 border-dashed rounded-xl p-4 text-center transition-all duration-200 ${
                              isDragging
                                ? "border-blue-500 bg-blue-50"
                                : "border-gray-200 group-hover:border-blue-400 group-hover:bg-blue-50/30"
                            }`}
                          >
                            <div className="bg-blue-50 w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform">
                              <Upload className="w-5 h-5 text-blue-600" />
                            </div>
                            <p className="text-xs font-bold text-gray-700">
                              {isDragging ? "Suelta aquí" : "Cargar Archivos"}
                            </p>
                            <p className="text-[10px] text-gray-400 mt-1">PDF, DOCX, XLSX</p>
                          </div>
                          <input
                            id="file-upload"
                            type="file"
                            multiple
                            accept=".pdf,.docx,.xlsx,.doc,.xls"
                            className="hidden"
                            onChange={(e) => handleFileSelect(e.target.files)}
                          />
                        </label>

                        <div>
                          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3">
                            Archivos ({documents.length})
                          </h3>
                          {filteredDocuments.length === 0 ? (
                            <div className="text-center py-6">
                              <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                              <p className="text-xs text-gray-500">Sin documentos</p>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              {filteredDocuments.slice(0, 10).map((doc) => {
                                const mapStatus = () => {
                                  switch (doc.technicalStatus) {
                                    case 'uploading':
                                      return { Icon: Loader2, label: 'Subiendo...', colorClass: 'text-blue-600', barColor: 'bg-gray-200', spin: true };
                                    case 'queued':
                                      return { Icon: Clock3, label: 'En cola', colorClass: 'text-gray-500', barColor: 'bg-gray-200', spin: false };
                                    case 'indexing':
                                      return { Icon: Loader2, label: 'Indexando...', colorClass: 'text-amber-600', barColor: 'bg-amber-500', spin: true };
                                    case 'completed':
                                      return { Icon: CheckCircle, label: 'Indexado', colorClass: 'text-emerald-600', barColor: '', spin: false };
                                    case 'error':
                                      return { Icon: AlertCircle, label: 'Error', colorClass: 'text-red-600', barColor: '', spin: false };
                                    case 'paused':
                                      return { Icon: XIcon, label: 'Pausado', colorClass: 'text-orange-700', barColor: '', spin: false };
                                    default:
                                      return { Icon: Loader2, label: 'Procesando...', colorClass: 'text-amber-600', barColor: 'bg-amber-500', spin: true };
                                  }
                                };
                                const { Icon, label, colorClass, barColor, spin } = mapStatus();
                                const showBar = doc.technicalStatus === 'queued' || doc.technicalStatus === 'indexing';
                                const percent = Math.max(0, Math.min(100, Math.round(doc.progress || 0)));
                                const barPercent = doc.technicalStatus === 'queued' ? 5 : percent;
                                return (
                                  <div key={doc.id} className="bg-white p-3 rounded-xl border border-gray-100 shadow-sm hover:border-blue-200 transition-colors group">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <div className="p-1.5 bg-indigo-50 rounded-lg group-hover:bg-indigo-100 transition-colors">
                                        <FileText size={14} className="text-indigo-500" />
                                      </div>
                                      <span className="text-xs font-bold text-gray-700 truncate flex-1">{doc.name}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
                                      <div className={`flex items-center gap-1 ${colorClass}`}>
                                        <Icon size={12} className={spin ? 'animate-spin' : ''} />
                                        <span>{label}</span>
                                      </div>
                                      {doc.technicalStatus === 'indexing' && <span className="text-gray-400">{percent}%</span>}
                                    </div>
                                    {showBar && (
                                      <div className="w-full h-1.5 bg-gray-100 rounded-full mt-2 overflow-hidden">
                                        <div className={`h-1.5 rounded-full ${barColor || 'bg-gray-300'}`} style={{ width: `${barPercent}%` }} />
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </ScrollArea>
                  )}
                </div>
              ) : (
                <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col items-center py-6 gap-6">
                  {/* Botón de flecha para expandir */}
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      leftPanelRef.current?.expand();
                      setIsLeftPanelCollapsed(false);
                    }}
                    className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-10 w-10"
                    title="Expandir panel"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </Button>
                </div>
              )}
            </ResizablePanel>

            <ResizableHandle 
              withHandle={!isLeftPanelCollapsed} 
              className={`w-1 transition-all duration-300 ${
                isLeftPanelCollapsed 
                  ? 'bg-transparent cursor-default' 
                  : 'bg-gray-100 hover:bg-blue-400 active:bg-blue-600'
              }`}
              disabled={isLeftPanelCollapsed}
            />

            {/* Center Panel - Chat (MAIN) */}
            <ResizablePanel id="center-panel" order={2} defaultSize={75} minSize={30}>
              <div className="h-full bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col">
                {/* Chat Header */}
                <div className="border-b border-gray-200 px-6 py-4 flex-shrink-0">
                  <h2 className="text-xl font-bold text-gray-900">LUMEN Chat</h2>
                  <p className="text-xs text-gray-500">Technical Assistant AI Layer</p>
                </div>

                {/* Messages Area - SCROLLABLE */}
                <div className="flex-1 overflow-y-auto px-6 py-6">
                  {messages.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center max-w-md">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 mb-4 shadow-lg">
                          <MessageSquare className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          Bienvenido a LUMEN
                        </h3>
                        <p className="text-sm text-gray-600 mb-4">
                          Pregunta sobre tus documentos corporativos
                        </p>
                        <div className="bg-gray-50 rounded-xl p-3 text-left">
                          <p className="text-xs font-semibold text-gray-700 mb-2">
                            Ejemplos:
                          </p>
                          <p className="text-xs text-gray-600">
                            • ¿Procedimiento de seguridad?
                          </p>
                          <p className="text-xs text-gray-600">
                            • Resume el manual de operaciones
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {messages.map((message) => (
                        <div key={message.id}>
                          {message.type === "assistant" ? (
                            <div className="flex items-start gap-3">
                              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 flex-shrink-0">
                                <Sparkles className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                                <div className="bg-gray-50 rounded-2xl p-4">
                                  <p className="text-sm text-gray-800">
                                    {message.content}
                                  </p>
                                </div>
                                {message.citation && (
                                  <button className="flex items-center gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 mt-2 text-left w-full">
                                    <FileText className="w-4 h-4 text-blue-600" />
                                    <div className="flex-1">
                                      <p className="text-xs font-semibold text-gray-900">
                                        {message.citation.title}
                                      </p>
                                      <p className="text-xs text-gray-600">
                                        {message.citation.subtitle}
                                      </p>
                                    </div>
                                    <ExternalLink className="w-4 h-4 text-blue-600" />
                                  </button>
                                )}
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-3 justify-end">
                              <div className="bg-blue-100 rounded-2xl px-4 py-3 max-w-md">
                                <p className="text-sm text-gray-900">
                                  {message.content}
                                </p>
                              </div>
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <User className="w-4 h-4 text-gray-600" />
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                      {isLoading && (
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <Sparkles className="w-4 h-4 text-white animate-pulse" />
                          </div>
                          <div className="bg-gray-50 rounded-2xl p-4">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" />
                              <div
                                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                style={{ animationDelay: "0.2s" }}
                              />
                              <div
                                className="w-2 h-2 bg-blue-600 rounded-full animate-bounce"
                                style={{ animationDelay: "0.4s" }}
                              />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Input - FIXED AT BOTTOM */}
                <div className="border-t border-gray-100 p-4 bg-white/50 backdrop-blur-sm flex-shrink-0">
                  <form onSubmit={handleSendMessage} className="flex gap-2 max-w-4xl mx-auto w-full">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="text-gray-400 hover:text-blue-600 hover:bg-blue-50 transition-colors flex-shrink-0"
                    >
                      <Paperclip className="w-5 h-5" />
                    </Button>
                    <div className="relative flex-1">
                      <Input
                        type="text"
                        placeholder="Escribe tu consulta aquí..."
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        className="w-full bg-gray-50 border-gray-200 focus:bg-white focus:ring-2 focus:ring-blue-100 transition-all pr-12 rounded-xl"
                        disabled={isLoading}
                      />
                      <div className="absolute right-2 top-1/2 -translate-y-1/2">
                        {isLoading && <Loader2 className="w-4 h-4 animate-spin text-blue-500" />}
                      </div>
                    </div>
                    <Button
                      type="submit"
                      size="icon"
                      className="bg-blue-600 hover:bg-blue-700 shadow-sm hover:shadow-md transition-all flex-shrink-0 rounded-xl"
                      disabled={!chatInput.trim() || isLoading}
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  <p className="text-[10px] font-medium text-gray-400 text-center mt-2 uppercase tracking-tighter">
                    LUMEN AI • INNOVATEC RAG-ENGINE V2.4
                  </p>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </main>
      </div>

      {/* Upload Dialog */}
      <Dialog open={showUploadDialog} onOpenChange={setShowUploadDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Asignar Área de Conocimiento</DialogTitle>
            <DialogDescription>
              Selecciona el área corporativa para estos documentos
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Archivos ({pendingFiles?.length || 0})
              </label>
              <div className="bg-gray-50 rounded-lg p-3 max-h-32 overflow-y-auto">
                {pendingFiles &&
                  Array.from(pendingFiles).map((file, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm py-1">
                      <FileText className="w-4 h-4 text-gray-400" />
                      <span className="truncate">{file.name}</span>
                    </div>
                  ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-900 mb-2 block">
                Área de Conocimiento *
              </label>
              <Select value={selectedArea} onValueChange={setSelectedArea}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona un área" />
                </SelectTrigger>
                <SelectContent>
                  {KNOWLEDGE_AREAS.map((area) => (
                    <SelectItem key={area} value={area}>
                      {area}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowUploadDialog(false);
                setPendingFiles(null);
                setSelectedArea("");
              }}
            >
              Cancelar
            </Button>
            <Button
              onClick={confirmUpload}
              disabled={!selectedArea}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Subir Documentos
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}