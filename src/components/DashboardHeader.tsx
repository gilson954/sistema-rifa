import React from 'react';
import { Bell, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';

const DashboardHeader = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors duration-300 mb-6">
      <div className="flex items-center space-x-4">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white transition-colors duration-300">
          👋 Olá, Usuário Demo
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        <button className="relative p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200">
          <Bell className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-purple-600 rounded-full"></span>
        </button>
        
        <button
          onClick={toggleTheme}
          className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-white transition-colors duration-200"
        >
          {theme === 'light' ? <Moon className="h-6 w-6" /> : <Sun className="h-6 w-6" />}
        </button>
        
        <div className="text-right">
          <p className="text-gray-900 dark:text-white font-medium transition-colors duration-300">
            {theme === 'light' ? 'Claro' : 'Escuro'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;