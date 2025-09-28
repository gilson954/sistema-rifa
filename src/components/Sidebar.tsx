import React, { useState, useEffect } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutGrid,
  CreditCard,
  Share2,
  BarChart3,
  Palette,
  User,
  HelpCircle,
  X,
  Trophy,
  Users,
  Menu,
  LogOut,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';
import SubscriptionStatus from './SubscriptionStatus';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [profile, setProfile] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id);

        if (data && data.length > 0) {
          setProfile(data[0]);
        }
      };
      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
    onClose?.();
    setIsMobileMenuOpen(false);
  };

  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
    onClose?.();
  };

  const displayName = profile?.name || user?.user_metadata?.name || 'Usuário';
  const displayEmail = profile?.email || user?.email || 'usuario@rifaqui.com';

  const menuItems = [
    { icon: LayoutGrid, label: 'Campanhas (Home)', path: '/dashboard' },
    { icon: CreditCard, label: 'Métodos de pagamentos', path: '/dashboard/integrations' },
    { icon: Trophy, label: 'Ranking', path: '/dashboard/ranking' },
    { icon: Users, label: 'Afiliações', path: '/dashboard/affiliations' },
    { icon: Share2, label: 'Redes sociais', path: '/dashboard/social-media' },
    { icon: BarChart3, label: 'Pixels e Analytics', path: '/dashboard/analytics' },
    { icon: Palette, label: 'Personalização', path: '/dashboard/customize' },
    { icon: User, label: 'Minha conta', path: '/dashboard/account' },
    { icon: HelpCircle, label: 'Tutoriais', path: '/dashboard/tutorials' },
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-white dark:bg-gray-900 text-gray-900 dark:text-white rounded-lg shadow-lg border border-gray-200 dark:border-gray-800"
      >
        <Menu className="h-6 w-6" />
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`
        w-64 bg-white dark:bg-gray-900 min-h-screen flex flex-col border-r border-gray-200 dark:border-gray-800
        md:relative md:translate-x-0
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {/* Mobile Close */}
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Logo */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex items-center">
            <img src="/logo-chatgpt.png" alt="Rifaqui Logo" className="w-8 h-8 object-contain" />
            <span className="ml-2 text-xl font-bold text-gray-900 dark:text-white">Rifaqui</span>
          </div>
        </div>

        {/* Profile Card — MESMO PADRÃO DOS CARDS DE CAMPANHA */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-800">
          <div className="rounded-2xl p-4 border bg-white/6 dark:bg-gray-900/40 border-gray-200/10 dark:border-gray-700/20 transition-all duration-200">
            <div className="flex items-start gap-4">
              {/* Avatar — moldura igual ao image do card (quadrada, rounded-lg) */}
              <div className="w-16 h-16 flex-shrink-0">
                <div
                  className="w-16 h-16 rounded-lg shadow-sm border border-gray-200/10 dark:border-gray-700/20 flex items-center justify-center animate-gradient-x"
                  style={{
                    background: 'linear-gradient(90deg, #FF0066, #00A1FF, #9B4DE5)',
                    backgroundSize: '200% 200%',
                    animation: 'gradient-x 6s linear infinite',
                  }}
                >
                  <span className="text-white font-semibold text-lg">{displayName.charAt(0).toUpperCase()}</span>
                </div>
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">{displayEmail}</p>

                <div className="mt-3">
                  <SubscriptionStatus showDetails={false} />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 overflow-y-auto">
          <ul className="space-y-2">
            {menuItems.map((item, index) => {
              const IconComponent = item.icon;
              return (
                <li key={index}>
                  <NavLink
                    to={item.path}
                    onClick={handleNavClick}
                    end={item.path === '/dashboard'}
                    className={({ isActive }) =>
                      `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left font-medium truncate transition-all duration-300
                      ${isActive ? 'text-white shadow-lg scale-[1.02]' : 'text-gray-700 dark:text-gray-300'}`
                    }
                    style={({ isActive }) =>
                      isActive
                        ? {
                            background: 'linear-gradient(90deg, #FF0066, #00A1FF, #9B4DE5)',
                            backgroundSize: '200% 200%',
                            animation: 'gradient-x 6s linear infinite',
                          }
                        : {}
                    }
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0" />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}

            {/* Logout Button */}
            <li>
              <button
                onClick={handleSignOut}
                className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left font-medium truncate transition-all duration-300 text-white shadow-lg"
                style={{
                  background: 'linear-gradient(90deg, #FF0000, #FF4D4D, #CC0000, #FF1A1A)',
                  backgroundSize: '200% 200%',
                  animation: 'gradient-x 6s linear infinite',
                }}
              >
                <LogOut className="h-5 w-5 flex-shrink-0" />
                <span>Sair</span>
              </button>
            </li>
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
