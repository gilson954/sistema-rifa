import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { 
  Home, 
  CreditCard, 
  Share2, 
  BarChart3, 
  Palette, 
  User, 
  HelpCircle, 
  LogOut,
  X
} from 'lucide-react';

interface SidebarProps {
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ onClose }) => {
  const navigate = useNavigate();

  const handleGoToLanding = () => {
    navigate('/');
    onClose?.();
  };

  const menuItems = [
    {
      icon: Home,
      label: 'Home',
      path: '/dashboard'
    },
    {
      icon: CreditCard,
      label: 'Configure seu pix',
      path: '/dashboard/integrations'
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
      label: 'Personalizar rifas',
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
    }
  ];

  return (
    <div className="w-60 bg-gray-900 min-h-screen flex flex-col">
      {/* Mobile Close Button */}
      <div className="md:hidden flex justify-end p-4">
        <button
          onClick={onClose}
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
          <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
            U
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              Usuário Demo
            </p>
            <p className="text-gray-400 text-sm truncate">
              demo@rifaqui.com
            </p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {menuItems.map((item, index) => {
            const IconComponent = item.icon;
            return (
              <li key={index}>
                <NavLink
                  to={item.path}
                  onClick={onClose}
                  end={item.path === '/dashboard'}
                  className={({ isActive }) =>
                    `w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                      isActive
                        ? 'bg-purple-600 text-white'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`
                  }
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout Button */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleGoToLanding}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;