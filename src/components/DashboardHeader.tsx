import React, { useState, useEffect } from 'react';
import { Bell, Sun, Moon, LogOut } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

const DashboardHeader = () => {
  const { theme, toggleTheme } = useTheme();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<{ name: string } | null>(null);

  useEffect(() => {
    if (user) {
      // Fetch user profile
      const fetchProfile = async () => {
        const { data } = await supabase
          .from('profiles')
          .select('name')
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
  };

  const displayName = profile?.name || user?.user_metadata?.name || 'Usuário';

  return (
    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-300">
      <div className="flex items-center space-x-4 min-w-0">
        {/* Removed h1 title completely */}
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
        
        <div className="text-right hidden sm:block">
          <p className="text-gray-900 dark:text-white font-medium transition-colors duration-300">
            {theme === 'light' ? 'Claro' : 'Escuro'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;