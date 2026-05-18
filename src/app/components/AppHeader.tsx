import { useNavigate } from 'react-router';
import { Lightbulb, MessageSquare, Mic, Database, LogOut, User, Menu } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '@/app/context/AuthContext';

interface AppHeaderProps {
  subtitle?: string;
  showSidebarToggle?: boolean;
  onSidebarToggle?: () => void;
  activeSection?: 'chat' | 'station' | 'admin';
  showUserInfo?: boolean;
  extraRight?: React.ReactNode;
}

export default function AppHeader({
  subtitle,
  showSidebarToggle = false,
  onSidebarToggle,
  activeSection,
  showUserInfo = true,
  extraRight,
}: AppHeaderProps) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  return (
    <header className="bg-white border-b border-gray-100 sticky top-0 z-10 shadow-sm flex-shrink-0">
      <div className="px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          {showSidebarToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onSidebarToggle}
              className="text-gray-500 hover:text-gray-900 h-8 w-8"
            >
              <Menu className="w-4 h-4" />
            </Button>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center shadow-sm group-hover:shadow-md transition-shadow">
              <Lightbulb className="w-4 h-4 text-white" />
            </div>
            <div className="text-left">
              <span className="text-base font-bold text-gray-900 leading-none">Lumen</span>
              {subtitle && (
                <p className="text-[10px] text-gray-400 leading-none mt-0.5">{subtitle}</p>
              )}
            </div>
          </button>
        </div>

        {activeSection && (
          <nav className="hidden md:flex items-center gap-0.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard')}
              className={`h-8 px-3 text-sm font-medium gap-1.5 rounded-lg ${
                activeSection === 'chat'
                  ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Lumen Chat
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/lumen-station')}
              className={`h-8 px-3 text-sm font-medium gap-1.5 rounded-lg ${
                activeSection === 'station'
                  ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              <Mic className="w-3.5 h-3.5" />
              Station
            </Button>
            {(user?.role === 'OWNER' || user?.role === 'ADMIN') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin')}
                className={`h-8 px-3 text-sm font-medium gap-1.5 rounded-lg ${
                  activeSection === 'admin'
                    ? 'text-blue-700 bg-blue-50 hover:bg-blue-100'
                    : 'text-gray-500 hover:text-gray-900'
                }`}
              >
                <Database className="w-3.5 h-3.5" />
                Admin
              </Button>
            )}
          </nav>
        )}

        <div className="flex items-center gap-2">
          {extraRight}
          {showUserInfo && user && (
            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 rounded-lg border border-slate-200">
              <User className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-sm text-slate-700 font-medium truncate max-w-[120px]">
                {user.name}
              </span>
            </div>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
            onClick={() => { logout(); navigate('/login'); }}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </header>
  );
}
