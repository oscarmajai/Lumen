import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Building2, Mail, Lock, User, ArrowRight, ArrowLeft, Lightbulb, Loader2, CheckCircle2, Copy, Link as LinkIcon } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function Register() {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // Step 1
  const [companyName, setCompanyName] = useState('');

  // Step 2
  const [adminName, setAdminName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Step 3 (success)
  const [registeredSlug, setRegisteredSlug] = useState('');
  const [registeredCompanyName, setRegisteredCompanyName] = useState('');

  const handleStep1 = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim().length < 2) {
      toast.error('El nombre de la empresa debe tener al menos 2 caracteres');
      return;
    }
    setStep(2);
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    if (password.length < 8) {
      toast.error('La contraseña debe tener al menos 8 caracteres');
      return;
    }

    setIsLoading(true);
    try {
      const result = await register({ company_name: companyName, admin_name: adminName, email, password });
      setRegisteredSlug(result.company.slug);
      setRegisteredCompanyName(result.company.name);
      setStep(3);
    } catch (err: any) {
      toast.error('Error al registrar', { description: err.message });
    } finally {
      setIsLoading(false);
    }
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

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          {/* Progress Steps */}
          {step < 3 && (
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
          )}

          {/* Step 1 */}
          {step === 1 && (
            <form onSubmit={handleStep1} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Registra tu Empresa</h2>
                <p className="text-gray-600">Comienza a iluminar el conocimiento de tu organización</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName" className="text-gray-700">Nombre de la Empresa *</Label>
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
                    minLength={2}
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

          {/* Step 2 */}
          {step === 2 && (
            <form onSubmit={handleStep2} className="space-y-6">
              <div className="text-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Crea tu Cuenta de Administrador</h2>
                <p className="text-gray-600">
                  Serás el Super Admin de <span className="text-cyan-600 font-medium">{companyName}</span>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="adminName" className="text-gray-700">Nombre Completo *</Label>
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
                <Label htmlFor="email" className="text-gray-700">Email *</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 bg-gray-50 border-gray-300 text-gray-900 placeholder:text-gray-400 focus:border-cyan-500 focus:ring-cyan-500/20"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-gray-700">Contraseña *</Label>
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
                    minLength={8}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-gray-700">Confirmar Contraseña *</Label>
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
                  disabled={isLoading}
                  className="bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Atrás
                </Button>
                <Button
                  type="submit"
                  disabled={isLoading}
                  className="flex-1 bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-6 text-base"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Registrando...
                    </>
                  ) : (
                    'Crear Cuenta'
                  )}
                </Button>
              </div>
            </form>
          )}

          {/* Step 3 — Success */}
          {step === 3 && (() => {
            const loginUrl = `${window.location.origin}/login?c=${registeredSlug}`;
            return (
              <div className="space-y-6 text-center">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">¡Empresa registrada!</h2>
                  <p className="text-gray-600 text-sm">
                    Bienvenido a Lumen, <span className="font-medium text-gray-800">{registeredCompanyName}</span>
                  </p>
                </div>

                {/* Slug box */}
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4 text-left space-y-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Código de empresa</p>
                    <div className="flex items-center gap-2">
                      <code className="flex-1 text-base font-bold text-cyan-700 bg-white border border-gray-200 rounded-lg px-3 py-2">
                        {registeredSlug}
                      </code>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 flex-shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(registeredSlug);
                          toast.success('Código copiado');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-1">Link de acceso para empleados</p>
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2 min-w-0">
                        <LinkIcon className="w-4 h-4 text-gray-400 flex-shrink-0" />
                        <span className="text-xs text-gray-600 truncate">{loginUrl}</span>
                      </div>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 flex-shrink-0"
                        onClick={() => {
                          navigator.clipboard.writeText(loginUrl);
                          toast.success('Link copiado');
                        }}
                      >
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <p className="text-xs text-gray-500">
                    Comparte este link o el código con tus empleados para que puedan iniciar sesión.
                  </p>
                </div>

                <Button
                  onClick={() => navigate(`/login?c=${registeredSlug}`)}
                  className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-6 text-base"
                >
                  Ir al inicio de sesión
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            );
          })()}

          {step < 3 && (
            <div className="mt-6 pt-6 border-t border-gray-200 text-center">
              <p className="text-sm text-gray-500">
                ¿Ya tienes cuenta?{' '}
                <button
                  onClick={() => navigate('/login')}
                  className="text-cyan-600 hover:text-cyan-700 font-medium"
                >
                  Iniciar Sesión
                </button>
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
