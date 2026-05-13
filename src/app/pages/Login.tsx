import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lightbulb, Lock, Mail, Building2, ArrowRight, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function Login() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login } = useAuth();

  // Pre-fill slug from ?c= query param (shareable employee link)
  const slugFromUrl = searchParams.get('c') ?? '';

  const [companySlug, setCompanySlug] = useState(slugFromUrl);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companySlug.trim()) {
      toast.error('Ingresa el código de tu empresa');
      return;
    }
    setIsLoading(true);
    try {
      await login(email, password, companySlug.trim().toLowerCase());

      const stored = localStorage.getItem('auth_user');
      const user = stored ? JSON.parse(stored) : null;
      navigate(user?.role === 'OWNER' || user?.role === 'ADMIN' ? '/admin' : '/dashboard');
    } catch (err: any) {
      toast.error('Error al iniciar sesión', { description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-cyan-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-cyan-100 mb-4">
            <Lightbulb className="w-10 h-10 text-cyan-600" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Lumen</h1>
          <p className="text-gray-600">Iluminando el conocimiento corporativo</p>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-semibold text-gray-900">Acceso Seguro</h2>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            {/* Company slug — badge if from URL, input if manual */}
            {slugFromUrl ? (
              <div className="flex items-center gap-3 px-4 py-3 bg-cyan-50 border border-cyan-200 rounded-xl">
                <CheckCircle2 className="w-5 h-5 text-cyan-600 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-cyan-700 font-medium">Empresa</p>
                  <p className="text-sm font-semibold text-cyan-900 truncate">{slugFromUrl}</p>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <Label htmlFor="company" className="text-gray-700">Código de empresa</Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="company"
                    type="text"
                    placeholder="mi-empresa"
                    value={companySlug}
                    onChange={(e) => setCompanySlug(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                    disabled={isLoading}
                    autoComplete="organization"
                  />
                </div>
                <p className="text-xs text-gray-400">Tu administrador te proporcionó este código</p>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-gray-700">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="usuario@empresa.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                  required
                  disabled={isLoading}
                  autoComplete="email"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-gray-700">Contraseña</Label>
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
                  disabled={isLoading}
                  autoComplete="current-password"
                />
              </div>
            </div>

            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-6 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Verificando...
                </>
              ) : (
                'Iniciar Sesión'
              )}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-center">
          <p className="text-gray-600 text-sm mb-3">¿Empresa nueva?</p>
          <Button
            onClick={() => navigate('/register')}
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
