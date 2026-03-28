import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Lightbulb, Lock, User, ArrowRight } from "lucide-react";

export default function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Mock login - admin@empresa.com goes to admin panel, others to dashboard
    if (email === "admin@empresa.com") {
      navigate("/admin");
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo and Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-100 mb-4">
            <Lightbulb className="w-10 h-10 text-cyan-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lumen</h1>
          <p className="text-gray-600">Iluminando el conocimiento corporativo</p>
        </div>

        {/* Login Form */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-semibold text-gray-900">Acceso Seguro</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">
                Email Corporativo
              </Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">
                Contraseña
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                  required
                />
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-6 text-base"
            >
              Iniciar Sesión
            </Button>
          </form>
        </div>

        {/* Register Link */}
        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-3">¿Empresa nueva?</p>
          <Button
            onClick={() => navigate("/register")}
            variant="outline"
            className="bg-white border-gray-300 text-cyan-600 hover:bg-gray-50 hover:border-cyan-400"
          >
            Registrar mi Empresa
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          Plataforma corporativa confidencial • Acceso autorizado
        </p>
      </div>
    </div>
  );
}