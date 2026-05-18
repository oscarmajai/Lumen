import { useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Lightbulb, Lock, Eye, EyeOff, AlertTriangle, ShieldCheck, Loader2 } from 'lucide-react';
import { useAuth } from '@/app/context/AuthContext';

export default function ChangePassword() {
  const navigate = useNavigate();
  const { user, mustChangePassword, changePassword } = useAuth();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const passwordStrength = (pwd: string) => {
    if (pwd.length === 0) return null;
    if (pwd.length < 8) return { label: 'Muy corta', color: 'bg-red-500', width: 'w-1/4' };
    if (pwd.length < 12 && !/[A-Z]/.test(pwd)) return { label: 'Débil', color: 'bg-orange-400', width: 'w-2/4' };
    if (pwd.length >= 12 && /[A-Z]/.test(pwd) && /[0-9]/.test(pwd)) return { label: 'Fuerte', color: 'bg-emerald-500', width: 'w-full' };
    return { label: 'Aceptable', color: 'bg-yellow-400', width: 'w-3/4' };
  };

  const strength = passwordStrength(newPassword);

  const validationError = () => {
    if (!currentPassword) return 'Ingresa tu contraseña actual';
    if (newPassword.length < 8) return 'La nueva contraseña debe tener al menos 8 caracteres';
    if (newPassword !== confirmPassword) return 'Las contraseñas no coinciden';
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validationError();
    if (error) { toast.error(error); return; }

    setIsLoading(true);
    try {
      await changePassword(currentPassword, newPassword);
      toast.success('Contraseña actualizada correctamente');
      const role = user?.role;
      navigate(role === 'OWNER' || role === 'ADMIN' ? '/admin' : '/dashboard', { replace: true });
    } catch (err: any) {
      toast.error('Error al cambiar contraseña', { description: err.message });
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
          <p className="text-gray-600">Cambio de contraseña</p>
        </div>

        {/* Forced-change banner */}
        {mustChangePassword && (
          <div className="mb-4 flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-amber-800">
            <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p className="text-sm font-medium">
              Debes establecer una contraseña personal antes de continuar. Tu administrador generó una contraseña temporal para ti.
            </p>
          </div>
        )}

        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
          <div className="flex items-center gap-2 mb-6">
            <ShieldCheck className="w-5 h-5 text-cyan-600" />
            <h2 className="text-xl font-semibold text-gray-900">Nueva contraseña</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Current password */}
            <div className="space-y-2">
              <Label htmlFor="current" className="text-gray-700">
                {mustChangePassword ? 'Contraseña temporal' : 'Contraseña actual'}
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="current"
                  type={showCurrent ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowCurrent((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* New password */}
            <div className="space-y-2">
              <Label htmlFor="new" className="text-gray-700">Nueva contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="new"
                  type={showNew ? 'text' : 'password'}
                  placeholder="Mínimo 8 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="pl-10 pr-10 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20"
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowNew((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {/* Strength indicator */}
              {strength && (
                <div className="space-y-1">
                  <div className="h-1.5 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div className={`h-1.5 rounded-full transition-all ${strength.color} ${strength.width}`} />
                  </div>
                  <p className="text-xs text-gray-500">{strength.label}</p>
                </div>
              )}
            </div>

            {/* Confirm password */}
            <div className="space-y-2">
              <Label htmlFor="confirm" className="text-gray-700">Confirmar contraseña</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repite la nueva contraseña"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={`pl-10 pr-10 bg-gray-50 border-gray-300 focus:border-cyan-500 focus:ring-cyan-500/20 ${
                    confirmPassword && newPassword !== confirmPassword
                      ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20'
                      : ''
                  }`}
                  disabled={isLoading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="text-xs text-red-500">Las contraseñas no coinciden</p>
              )}
            </div>

            <Button
              type="submit"
              disabled={isLoading || !!validationError()}
              className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-semibold py-6 text-base"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Actualizando...
                </>
              ) : (
                'Cambiar contraseña'
              )}
            </Button>
          </form>
        </div>

        {/* Optional: skip link only for voluntary change */}
        {!mustChangePassword && (
          <div className="mt-4 text-center">
            <button
              onClick={() => navigate(-1)}
              className="text-sm text-gray-500 hover:text-gray-700 underline underline-offset-2"
            >
              Cancelar
            </button>
          </div>
        )}

        <p className="text-center text-gray-500 text-xs mt-6">
          Plataforma corporativa confidencial • Acceso autorizado
        </p>
      </div>
    </div>
  );
}
