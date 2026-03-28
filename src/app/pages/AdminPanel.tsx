import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Upload,
  FileText,
  Trash2,
  Search,
  LogOut,
  Shield,
  CheckCircle2,
  Clock,
  Users,
  User,
  Plus,
  Edit,
  FolderLock,
  Lightbulb,
  MessageSquare,
  Settings,
  Send,
  Sparkles,
  X,
} from "lucide-react";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import ChatMessage from "../components/ChatMessage";
import WelcomeScreen from "../components/WelcomeScreen";

// Mock data
const initialDocuments = [
  {
    id: "1",
    name: "Manual_Mantenimiento_Industrial_2023.pdf",
    uploadDate: "2024-01-15",
    pages: 156,
    status: "processed" as const,
    size: "12.3 MB",
    area: "Técnico",
    uploadedBy: "Admin Principal",
  },
  {
    id: "2",
    name: "Reglamento_RRHH_2024.pdf",
    uploadDate: "2024-02-10",
    pages: 89,
    status: "processed" as const,
    size: "5.7 MB",
    area: "Recursos Humanos",
    uploadedBy: "María García",
  },
  {
    id: "3",
    name: "Manual_Finanzas_Procedimientos.pdf",
    uploadDate: "2024-02-20",
    pages: 234,
    status: "processed" as const,
    size: "18.9 MB",
    area: "Finanzas",
    uploadedBy: "Carlos Ruiz",
  },
];

const initialUsers = [
  {
    id: "1",
    name: "Admin Principal",
    email: "admin@empresa.com",
    role: "Super Admin" as const,
    areas: ["Todas"],
    createdAt: "2024-01-01",
  },
  {
    id: "2",
    name: "María García",
    email: "maria.garcia@empresa.com",
    role: "Manager" as const,
    areas: ["Recursos Humanos"],
    createdAt: "2024-01-15",
  },
  {
    id: "3",
    name: "Carlos Ruiz",
    email: "carlos.ruiz@empresa.com",
    role: "Manager" as const,
    areas: ["Finanzas", "Legal"],
    createdAt: "2024-02-01",
  },
  {
    id: "4",
    name: "Ana Martínez",
    email: "ana.martinez@empresa.com",
    role: "User" as const,
    areas: ["Recursos Humanos"],
    createdAt: "2024-02-15",
  },
];

const availableAreas = ["Recursos Humanos", "Finanzas", "Técnico", "Ventas", "Legal", "Operaciones"];

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
];

export default function AdminPanel() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("chat");
  const [documents, setDocuments] = useState(initialDocuments);
  const [users, setUsers] = useState(initialUsers);
  const [searchQuery, setSearchQuery] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  
  // New user form
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserRole, setNewUserRole] = useState<"Manager" | "User">("User");
  const [newUserAreas, setNewUserAreas] = useState<string[]>([]);
  const [newUserPassword, setNewUserPassword] = useState("");

  // Chat state
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

  const handleLogout = () => {
    navigate("/");
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files) return;

    const newDocs = Array.from(files).map((file, index) => ({
      id: `new-${Date.now()}-${index}`,
      name: file.name,
      uploadDate: new Date().toISOString().split("T")[0],
      pages: Math.floor(Math.random() * 200) + 20,
      status: "processing" as const,
      size: `${(file.size / (1024 * 1024)).toFixed(1)} MB`,
      area: "General",
      uploadedBy: "Admin Principal",
    }));

    setDocuments((prev) => [...newDocs, ...prev]);

    setTimeout(() => {
      setDocuments((prev) =>
        prev.map((doc) =>
          newDocs.find((d) => d.id === doc.id)
            ? { ...doc, status: "processed" as const }
            : doc
        )
      );
    }, 3000);
  };

  const handleDeleteDocument = (id: string) => {
    setDocuments((prev) => prev.filter((doc) => doc.id !== id));
  };

  const handleDeleteUser = (id: string) => {
    setUsers((prev) => prev.filter((user) => user.id !== id));
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    const newUser = {
      id: `user-${Date.now()}`,
      name: newUserName,
      email: newUserEmail,
      role: newUserRole,
      areas: newUserAreas,
      createdAt: new Date().toISOString().split("T")[0],
    };
    setUsers((prev) => [...prev, newUser]);
    setIsUserDialogOpen(false);
    // Reset form
    setNewUserName("");
    setNewUserEmail("");
    setNewUserRole("User");
    setNewUserAreas([]);
    setNewUserPassword("");
  };

  const toggleArea = (area: string) => {
    setNewUserAreas((prev) =>
      prev.includes(area) ? prev.filter((a) => a !== area) : [...prev, area]
    );
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileUpload(e.dataTransfer.files);
  };

  const handleSubmitQuery = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    const userMessage = {
      type: "user" as const,
      content: query,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    setTimeout(() => {
      const mockResponse = mockResponses[0];
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

  const handleExampleQuery = (exampleQuery: string) => {
    setQuery(exampleQuery);
  };

  const filteredDocuments = documents.filter((doc) =>
    doc.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const stats = {
    totalDocs: documents.length,
    processed: documents.filter((d) => d.status === "processed").length,
    processing: documents.filter((d) => d.status === "processing").length,
    totalUsers: users.length,
  };

  return (
    <div className="min-h-screen bg-white flex flex-col">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-600">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">Lumen</h1>
              <p className="text-xs text-gray-500">Panel de Administración</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-2 bg-purple-50 rounded-lg border border-purple-200">
              <Shield className="w-4 h-4 text-purple-600" />
              <span className="text-sm text-purple-700 font-semibold">
                Super Admin
              </span>
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

      <main className="flex-1 flex flex-col bg-gray-50">
        <div className="max-w-7xl w-full mx-auto px-4 py-6">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-white border border-gray-200 shadow-sm">
              <TabsTrigger value="chat" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-50 data-[state=active]:to-blue-50 data-[state=active]:text-cyan-700 data-[state=active]:font-semibold">
                <MessageSquare className="w-4 h-4 mr-2" />
                Chat IA
              </TabsTrigger>
              <TabsTrigger value="documents" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-50 data-[state=active]:to-blue-50 data-[state=active]:text-cyan-700 data-[state=active]:font-semibold">
                <FileText className="w-4 h-4 mr-2" />
                Documentos
              </TabsTrigger>
              <TabsTrigger value="users" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-50 data-[state=active]:to-blue-50 data-[state=active]:text-cyan-700 data-[state=active]:font-semibold">
                <Users className="w-4 h-4 mr-2" />
                Usuarios
              </TabsTrigger>
            </TabsList>

            {/* Chat Tab */}
            <TabsContent value="chat" className="flex-1 flex flex-col m-0">
              {messages.length === 0 ? (
                <WelcomeScreen onExampleClick={handleExampleQuery} />
              ) : (
                <div className="flex-1 overflow-y-auto mb-4">
                  <div className="max-w-4xl mx-auto space-y-6">
                    {messages.map((message, index) => (
                      <ChatMessage key={index} message={message} />
                    ))}
                    {isLoading && (
                      <div className="flex items-start gap-4">
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-cyan-100 flex-shrink-0">
                          <Sparkles className="w-5 h-5 text-cyan-600 animate-pulse" />
                        </div>
                        <div className="flex-1 bg-white border border-gray-200 rounded-2xl p-4 shadow-sm">
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
                            <span className="ml-2 text-sm">Analizando documentos...</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Input Area */}
              <div className="border-t border-gray-200 bg-white/80 backdrop-blur-sm pt-4">
                <div className="max-w-4xl mx-auto">
                  <form onSubmit={handleSubmitQuery} className="relative">
                    <Textarea
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      placeholder="¿Qué necesitas saber hoy del archivo?"
                      className="min-h-[120px] pr-14 bg-white border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20 resize-none"
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSubmitQuery(e);
                        }
                      }}
                    />
                    <Button
                      type="submit"
                      size="icon"
                      disabled={!query.trim() || isLoading}
                      className="absolute bottom-3 right-3 bg-cyan-600 hover:bg-cyan-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </form>
                  <p className="text-xs text-gray-500 mt-3 text-center">
                    Lumen solo consulta documentos autorizados • Respuestas 100% trazables
                  </p>
                </div>
              </div>
            </TabsContent>

            {/* Documents Tab */}
            <TabsContent value="documents" className="space-y-6">
              {/* Stats */}
              <div className="grid md:grid-cols-3 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Total Documentos</span>
                    <FileText className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalDocs}</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Procesados</span>
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.processed}</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">En Proceso</span>
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.processing}</div>
                </div>
              </div>

              {/* Upload Area */}
              <div
                className={`border-2 border-dashed rounded-2xl p-12 text-center transition-all ${
                  isDragging
                    ? "border-cyan-400 bg-cyan-50"
                    : "border-gray-300 bg-white"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-cyan-100 mx-auto mb-4">
                  <Upload className="w-8 h-8 text-cyan-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  Subir Documentos Corporativos
                </h3>
                <p className="text-gray-600 mb-6">
                  Arrastra archivos PDF aquí o haz clic para seleccionar
                </p>
                <input
                  type="file"
                  multiple
                  accept=".pdf"
                  onChange={(e) => handleFileUpload(e.target.files)}
                  className="hidden"
                  id="file-upload"
                />
                <Button 
                  type="button"
                  onClick={() => document.getElementById('file-upload')?.click()}
                  className="bg-cyan-600 hover:bg-cyan-700 text-white"
                >
                  Seleccionar Archivos
                </Button>
              </div>

              {/* Documents List */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Base de Conocimiento
                  </h2>
                  <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Buscar documentos..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  {filteredDocuments.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-cyan-100">
                          <FileText className="w-6 h-6 text-cyan-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1">
                            <h3 className="text-gray-900 font-medium">{doc.name}</h3>
                            <Badge
                              className={
                                doc.status === "processed"
                                  ? "bg-green-100 text-green-700 border-green-200"
                                  : "bg-amber-100 text-amber-700 border-amber-200"
                              }
                            >
                              {doc.status === "processed" ? "Procesado" : "Procesando..."}
                            </Badge>
                            <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                              {doc.area}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{doc.pages} páginas</span>
                            <span>•</span>
                            <span>{doc.size}</span>
                            <span>•</span>
                            <span>Subido por {doc.uploadedBy}</span>
                            <span>•</span>
                            <span>{doc.uploadDate}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-cyan-600 hover:bg-cyan-50"
                        >
                          <FolderLock className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteDocument(doc.id)}
                          className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            {/* Users Tab */}
            <TabsContent value="users" className="space-y-6">
              {/* User Stats */}
              <div className="grid md:grid-cols-4 gap-4">
                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Total Usuarios</span>
                    <Users className="w-5 h-5 text-cyan-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">{stats.totalUsers}</div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Super Admins</span>
                    <Shield className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "Super Admin").length}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Managers</span>
                    <Users className="w-5 h-5 text-amber-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "Manager").length}
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-gray-600 text-sm">Usuarios</span>
                    <Users className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-gray-900">
                    {users.filter((u) => u.role === "User").length}
                  </div>
                </div>
              </div>

              {/* Create User Button */}
              <div className="flex justify-end">
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button className="bg-cyan-600 hover:bg-cyan-700 text-white">
                      <Plus className="w-4 h-4 mr-2" />
                      Crear Usuario
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-white border-gray-200 text-gray-900 max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Crear Nuevo Usuario</DialogTitle>
                      <DialogDescription className="text-gray-600">
                        Agrega un nuevo usuario a la plataforma y asigna las áreas a las que tendrá acceso
                      </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="userName" className="text-gray-700">Nombre Completo</Label>
                          <Input
                            id="userName"
                            value={newUserName}
                            onChange={(e) => setNewUserName(e.target.value)}
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userEmail" className="text-gray-700">Email</Label>
                          <Input
                            id="userEmail"
                            type="email"
                            value={newUserEmail}
                            onChange={(e) => setNewUserEmail(e.target.value)}
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="userPassword" className="text-gray-700">Contraseña</Label>
                          <Input
                            id="userPassword"
                            type="password"
                            value={newUserPassword}
                            onChange={(e) => setNewUserPassword(e.target.value)}
                            className="bg-gray-50 border-gray-300 text-gray-900"
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="userRole" className="text-gray-700">Rol</Label>
                          <Select value={newUserRole} onValueChange={(value: "Manager" | "User") => setNewUserRole(value)}>
                            <SelectTrigger className="bg-gray-50 border-gray-300 text-gray-900">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-white border-gray-200 text-gray-900">
                              <SelectItem value="User">Usuario (Solo consulta)</SelectItem>
                              <SelectItem value="Manager">Manager (Puede subir documentos)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-700">Áreas de Acceso (selecciona una o más)</Label>
                        <div className="grid grid-cols-2 gap-3 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                          {availableAreas.map((area) => (
                            <div key={area} className="flex items-center space-x-2">
                              <Checkbox
                                id={area}
                                checked={newUserAreas.includes(area)}
                                onCheckedChange={() => toggleArea(area)}
                              />
                              <label
                                htmlFor={area}
                                className="text-sm text-gray-700 cursor-pointer"
                              >
                                {area}
                              </label>
                            </div>
                          ))}
                        </div>
                        {newUserAreas.length > 0 && (
                          <div className="flex flex-wrap gap-2 mt-2">
                            {newUserAreas.map((area) => (
                              <Badge key={area} className="bg-cyan-100 text-cyan-700 border-cyan-200">
                                {area}
                                <button
                                  type="button"
                                  onClick={() => toggleArea(area)}
                                  className="ml-1 hover:text-cyan-900"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <Button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white">
                        Crear Usuario
                      </Button>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>

              {/* Users List */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">
                  Gestión de Usuarios
                </h2>

                <div className="space-y-2">
                  {users.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center justify-between p-4 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 hover:shadow-sm transition-all"
                    >
                      <div className="flex items-center gap-4 flex-1">
                        <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-gradient-to-br from-cyan-100 to-purple-100">
                          <User className="w-6 h-6 text-cyan-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-1 flex-wrap">
                            <h3 className="text-gray-900 font-medium">{user.name}</h3>
                            <Badge
                              className={
                                user.role === "Super Admin"
                                  ? "bg-purple-100 text-purple-700 border-purple-200"
                                  : user.role === "Manager"
                                  ? "bg-amber-100 text-amber-700 border-amber-200"
                                  : "bg-green-100 text-green-700 border-green-200"
                              }
                            >
                              {user.role}
                            </Badge>
                            {user.areas.map((area) => (
                              <Badge key={area} className="bg-blue-100 text-blue-700 border-blue-200">
                                {area}
                              </Badge>
                            ))}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{user.email}</span>
                            <span>•</span>
                            <span>Desde {user.createdAt}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-gray-400 hover:text-cyan-600 hover:bg-cyan-50"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {user.role !== "Super Admin" && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDeleteUser(user.id)}
                            className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}