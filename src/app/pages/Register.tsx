import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Building2, Mail, Lock, User, ArrowRight, ArrowLeft, Lightbulb } from "lucide-react";

export default function Register() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  
  // Step 1: Company info
  const [companyName, setCompanyName] = useState("");
  const [companyEmail, setCompanyEmail] = useState("");
  
  // Step 2: Admin user info
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    setStep(2);
  };

  const handleStep2 = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock registration - redirect to admin panel
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-100 mb-4">
            <Lightbulb className="w-10 h-10 text-cyan-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Lumen</h1>
        </div>

        {/* Registration Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          {/* Progress Steps */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-cyan-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-cyan-100 border-2 border-cyan-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                <span className="text-sm font-bold">1</span>
              </div>
              <span className="text-sm font-medium hidden sm:inline">Empresa</span>
            </div>
            <div className={`h-px w-12 ${step >= 2 ? 'bg-cyan-600' : 'bg-gray-300'}`} />
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-cyan-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-cyan-100 border-2 border-cyan-600' : 'bg-gray-100 border-2 border-gray-300'}`}>
                <span className="text-sm font-bold">2</span>
              </div>
              <span className="text-sm font-medium hidden sm:inline">Administrador</span>
            </div>
          </div>

          {/* Step 1: Company Information */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registra tu Empresa</h2>
                <p className="text-gray-600">Comienza a iluminar el conocimiento de tu organización</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700">
                  Nombre de la Empresa *
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="companyName"
                    type="text"
                    placeholder="Acme Corporation"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyEmail" className="text-gray-700">
                  Email Corporativo *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="companyEmail"
                    type="email"
                    placeholder="contacto@empresa.com"
                    value={companyEmail}
                    onChange={(e) => setCompanyEmail(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-6 text-base"
              >
                Continuar
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </form>
          )}

          {/* Step 2: Admin User */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Crea tu Cuenta de Administrador</h2>
                <p className="text-gray-600">Serás el Super Admin de <span className="text-cyan-600 font-medium">{companyName}</span></p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-gray-700">
                  Nombre Completo *
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="adminName"
                    type="text"
                    placeholder="Juan Pérez"
                    value={adminName}
                    onChange={(e) => setAdminName(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminEmail" className="text-gray-700">
                  Email *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="adminEmail"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminPassword" className="text-gray-700">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="adminPassword"
                    type="password"
                    placeholder="••••••••"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">
                  Confirmar Contraseña *
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  onClick={() => setStep(1)}
                  variant="outline"
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-6 text-base"
                >
                  Crear Cuenta
                </Button>
              </div>
            </form>
          )}

          {/* Footer */}
          <div className="mt-6 pt-6 border-t border-gray-200 text-center">
            <p className="text-sm text-gray-500">
              ¿Ya tienes cuenta?{" "}
              <button
                onClick={() => navigate("/")}
                className="text-cyan-600 hover:text-cyan-700 font-medium"
              >
                Iniciar Sesión
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}