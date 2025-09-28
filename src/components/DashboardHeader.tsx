import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const DashboardHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (user) {
      // Fetch user profile
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('name')
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
  };

  const displayName = profile?.name || user?.user_metadata?.name || 'Usuário';

  return (
    <div className="m-4 sm:m-6 rounded-2xl p-4 sm:p-6 shadow-sm border border-gray-200/20 dark:border-gray-800/30 bg-white/60 dark:bg-gray-900/50 backdrop-blur-sm flex items-center justify-between transition-colors duration-300">
      <div className="flex items-center space-x-4 min-w-0">
        {/* Pode colocar o nome do app aqui se quiser */}
        <h1 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-white truncate">
          Rifaqui
        </h1>
      </div>
      
      <div className="flex items-center space-x-2 sm:space-x-4 flex-shrink-0">
        <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200">
          <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full"></span>
        </button>
        
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
        >
          {theme === 'light' ? <Moon className="h-5 w-5 sm:h-6 sm:w-6" /> : <Sun className="h-5 w-5 sm:h-6 sm:w-6" />}
        </button>

        <button
          onClick={handleSignOut}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors duration-200"
          title="Sair"
        >
          <LogOut className="h-5 w-5 sm:h-6 sm:w-6" />
        </button>

        {/* Avatar / iniciais do usuário */}
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center text-white text-sm font-semibold">
          {(displayName && displayName[0]?.toUpperCase()) || 'U'}
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
