import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutGrid, 
  CreditCard, 
  Share2, 
  BarChart3, 
  Palette, 
  User, 
  HelpCircle, 
  LogOut
} from 'lucide-react';

const Sidebar = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const menuItems = [
    {
      icon: LayoutGrid,
      label: 'Campanhas',
      active: true
    },
    {
      icon: CreditCard,
      label: 'Configure seu pix',
      active: false
    },
    {
      icon: Share2,
      label: 'Redes sociais',
      active: false
    },
    {
      icon: BarChart3,
      label: 'Pixels e Analytics',
      active: false
    },
    {
      icon: Palette,
      label: 'Personalizar rifas',
      active: false
    },
    {
      icon: User,
      label: 'Minha conta',
      active: false
    },
    {
      icon: HelpCircle,
      label: 'Suporte e tutoriais',
      active: false
    }
  ];

  return (
    <div className="w-80 bg-gray-900 min-h-screen flex flex-col">
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
            G
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white font-medium truncate">
              Gilson Rezende
            </p>
            <p className="text-gray-400 text-sm truncate">
              gilsonguil0@gmail.com
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
                <button
                  className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors duration-200 ${
                    item.active
                      ? 'bg-purple-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <IconComponent className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-gray-800">
        <button
          onClick={handleGoHome}
          className="w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-gray-300 hover:bg-gray-800 hover:text-white transition-colors duration-200"
        >
          <LogOut className="h-5 w-5" />
          <span className="font-medium">Sair do app</span>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;