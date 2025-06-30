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
  Home,
  X,
  Trophy,
  Users,
  Menu,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

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
      // Fetch user profile
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('name, email')
          .eq('id', user.id)
          .single();
        
        if (data) {
          setProfile(data);
        }
      };

      fetchProfile();
    }
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
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
    {
      icon: LayoutGrid,
      label: 'Campanhas (Home)',
      path: '/dashboard'
    },
    {
      icon: CreditCard,
      label: 'Métodos de pagamentos',
      path: '/dashboard/integrations'
    },
    {
      icon: Trophy,
      label: 'Ranking',
      path: '/dashboard/ranking'
    },
    {
      icon: Users,
      label: 'Afiliações',
      path: '/dashboard/affiliations'
    },
    {
      icon: Share2,
      label: 'Redes sociais',
      path: '/dashboard/social-media'
    },
    {
      icon: BarChart3,
      label: 'Pixels e Analytics',
      path: '/dashboard/analytics'
    },
    {
      icon: Palette,
      label: 'Personalização',
      path: '/dashboard/customize'
    },
    {
      icon: User,
      label: 'Minha conta',
      path: '/dashboard/account'
    },
    {
      icon: HelpCircle,
      label: 'Tutoriais',
      path: '/dashboard/tutorials'
    },
    {
      icon: Home,
      label: 'Página Inicial',
      path: '/'
    }
  ];

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileMenuOpen(true)}
        className="md:hidden fixed top-4 left-4 z-50 p-2 bg-gray-900 text-white rounded-lg"
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
      <div className={`
        w-60 bg-gray-900 min-h-screen flex flex-col
        md:relative md:translate-x-0
        fixed inset-y-0 left-0 z-50 transform transition-transform duration-300 ease-in-out
        ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        {/* Mobile Close Button */}
        <div className="md:hidden flex justify-end p-4">
          <button
            onClick={() => setIsMobileMenuOpen(false)}
            className="text-gray-400 hover:text-white transition-colors duration-200"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center">
            <img 
              src="/32132123.png" 
              alt="Rifaqui Logo" 
              className="w-8 h-8 object-contain"
            />
            <span className="ml-2 text-xl font-bold text-white">Rifaqui</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
              {displayName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium truncate">
                {displayName}
              </p>
              <p className="text-gray-400 text-sm truncate">
                {displayEmail}
              </p>
            </div>
          </div>
        </div>

        {/* Navigation Menu */}
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
                      `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                        isActive
                          ? 'bg-purple-600 text-white'
                          : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                      }`
                    }
                  >
                    <IconComponent className="h-5 w-5 flex-shrink-0" />
                    <span className="font-medium truncate">{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* Bottom Actions */}
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleSignOut}
            className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-red-600 hover:text-white transition-colors duration-200"
          >
            <LogOut className="h-5 w-5 flex-shrink-0" />
            <span className="font-medium truncate">Sair</span>
          </button>
        </div>
      </div>
    </>
  );
};

export default Sidebar;