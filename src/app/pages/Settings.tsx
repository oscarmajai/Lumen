import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import {
  ArrowLeft,
  User,
  Building,
  Key,
  Database,
  Bell,
  Save,
  Trash2,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Switch } from "../components/ui/switch";

export default function Settings() {
  const navigate = useNavigate();
  
  // User Settings
  const [userName, setUserName] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [userRole, setUserRole] = useState("");
  
  // Company Settings
  const [companyName, setCompanyName] = useState("");
  const [companyIndustry, setCompanyIndustry] = useState("");
  const [companySize, setCompanySize] = useState("");
  
  // API Settings
  const [apiKey, setApiKey] = useState("");
  const [ragEndpoint, setRagEndpoint] = useState("");
  const [ocrEndpoint, setOcrEndpoint] = useState("");
  
  // Notification Settings
  const [emailNotifications, setEmailNotifications] = useState(false);
  const [documentProcessing, setDocumentProcessing] = useState(false);
  const [systemAlerts, setSystemAlerts] = useState(false);

  const handleSaveSettings = async () => {
    // TODO: Replace with actual API call
    // const response = await fetch('/api/settings', {
    //   method: 'PUT',
    //   body: JSON.stringify({ userName, userEmail, companyName, ... })
    // });
    console.log("Settings saved");
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10 shadow-sm">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/")}
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Configuración
                </h1>
                <p className="text-sm text-gray-500">
                  Administra tu cuenta y preferencias
                </p>
              </div>
            </div>
            
            <Button
              onClick={handleSaveSettings}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Save className="w-4 h-4 mr-2" />
              Guardar Cambios
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 p-6">
        <div className="max-w-5xl mx-auto">
          <Tabs defaultValue="user" className="space-y-6">
            <TabsList className="bg-white border border-gray-200 shadow-sm">
              <TabsTrigger value="user" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-blue-50 data-[state=active]:text-blue-700">
                <User className="w-4 h-4 mr-2" />
                Usuario
              </TabsTrigger>
              <TabsTrigger value="company" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-blue-50 data-[state=active]:text-blue-700">
                <Building className="w-4 h-4 mr-2" />
                Empresa
              </TabsTrigger>
              <TabsTrigger value="api" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-blue-50 data-[state=active]:text-blue-700">
                <Key className="w-4 h-4 mr-2" />
                API
              </TabsTrigger>
              <TabsTrigger value="notifications" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-50 data-[state=active]:to-blue-50 data-[state=active]:text-blue-700">
                <Bell className="w-4 h-4 mr-2" />
                Notificaciones
              </TabsTrigger>
            </TabsList>

            {/* User Settings */}
            <TabsContent value="user">
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Información Personal
                  </h2>
                  <p className="text-sm text-gray-600">
                    Actualiza tu información de perfil
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="userName">Nombre Completo</Label>
                    <Input
                      id="userName"
                      type="text"
                      placeholder="Ingresa tu nombre"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="userEmail">Correo Electrónico</Label>
                    <Input
                      id="userEmail"
                      type="email"
                      placeholder="correo@empresa.com"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="userRole">Rol</Label>
                    <Input
                      id="userRole"
                      type="text"
                      placeholder="Ej: Ingeniero, Analista"
                      value={userRole}
                      onChange={(e) => setUserRole(e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="newPassword">Nueva Contraseña</Label>
                    <Input
                      id="newPassword"
                      type="password"
                      placeholder="••••••••"
                      className="bg-gray-50"
                    />
                    <p className="text-xs text-gray-500">
                      Deja en blanco si no deseas cambiar tu contraseña
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button variant="destructive" size="sm">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Eliminar Cuenta
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Company Settings */}
            <TabsContent value="company">
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Información de la Empresa
                  </h2>
                  <p className="text-sm text-gray-600">
                    Configuración corporativa
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="companyName">Nombre de la Empresa</Label>
                    <Input
                      id="companyName"
                      type="text"
                      placeholder="Nombre de tu empresa"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="companyIndustry">Industria</Label>
                    <Input
                      id="companyIndustry"
                      type="text"
                      placeholder="Ej: Manufactura, Tecnología"
                      value={companyIndustry}
                      onChange={(e) => setCompanyIndustry(e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="companySize">Tamaño de la Empresa</Label>
                    <Input
                      id="companySize"
                      type="text"
                      placeholder="Ej: 1-50, 50-200, 200+"
                      value={companySize}
                      onChange={(e) => setCompanySize(e.target.value)}
                      className="bg-gray-50"
                    />
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* API Settings */}
            <TabsContent value="api">
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Configuración de API
                  </h2>
                  <p className="text-sm text-gray-600">
                    Conecta Lumen con tus servicios backend
                  </p>
                </div>

                <div className="grid gap-6">
                  <div className="grid gap-2">
                    <Label htmlFor="apiKey">API Key</Label>
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="sk_live_..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="bg-gray-50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      Tu clave de API para autenticación
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="ragEndpoint">RAG Engine Endpoint</Label>
                    <Input
                      id="ragEndpoint"
                      type="url"
                      placeholder="https://api.tuempresa.com/rag"
                      value={ragEndpoint}
                      onChange={(e) => setRagEndpoint(e.target.value)}
                      className="bg-gray-50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      URL del servicio RAG para procesamiento de consultas
                    </p>
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="ocrEndpoint">OCR Service Endpoint</Label>
                    <Input
                      id="ocrEndpoint"
                      type="url"
                      placeholder="https://api.tuempresa.com/ocr"
                      value={ocrEndpoint}
                      onChange={(e) => setOcrEndpoint(e.target.value)}
                      className="bg-gray-50 font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500">
                      URL del servicio OCR para extracción de texto
                    </p>
                  </div>

                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <h3 className="text-sm font-semibold text-blue-900 mb-2">
                      Ejemplo de Configuración
                    </h3>
                    <pre className="text-xs text-blue-800 font-mono bg-blue-100 p-3 rounded overflow-x-auto">
{`{
  "ragEndpoint": "https://api.tuempresa.com/rag",
  "ocrEndpoint": "https://api.tuempresa.com/ocr",
  "apiKey": "sk_live_xxxxx"
}`}
                    </pre>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-200">
                  <Button className="bg-blue-600 hover:bg-blue-700">
                    <Database className="w-4 h-4 mr-2" />
                    Probar Conexión
                  </Button>
                </div>
              </div>
            </TabsContent>

            {/* Notifications */}
            <TabsContent value="notifications">
              <div className="bg-white rounded-xl border border-gray-200 p-8 shadow-sm space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">
                    Preferencias de Notificaciones
                  </h2>
                  <p className="text-sm text-gray-600">
                    Controla cómo y cuándo recibes notificaciones
                  </p>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Notificaciones por Email
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Recibe actualizaciones importantes por correo
                      </p>
                    </div>
                    <Switch
                      checked={emailNotifications}
                      onCheckedChange={setEmailNotifications}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4 border-b border-gray-200">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Procesamiento de Documentos
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Notificar cuando un documento termine de indexarse
                      </p>
                    </div>
                    <Switch
                      checked={documentProcessing}
                      onCheckedChange={setDocumentProcessing}
                    />
                  </div>

                  <div className="flex items-center justify-between py-4">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-gray-900">
                        Alertas del Sistema
                      </h3>
                      <p className="text-sm text-gray-600 mt-1">
                        Recibir alertas de mantenimiento y actualizaciones
                      </p>
                    </div>
                    <Switch
                      checked={systemAlerts}
                      onCheckedChange={setSystemAlerts}
                    />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
}