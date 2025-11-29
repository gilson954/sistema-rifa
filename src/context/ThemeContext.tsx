import React, { useEffect, useState } from 'react';
import ThemeContext, { type Theme } from './theme-context';

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se há uma preferência salva no localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme === 'light' || savedTheme === 'dark') {
      return savedTheme;
    }
    
    // Para novos usuários, definir tema escuro como padrão
    return 'dark';
  });

  useEffect(() => {
    // Salvar a preferência no localStorage
    localStorage.setItem('theme', theme);
    
    // Aplicar ou remover a classe 'dark' no elemento html
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    
    // Remover classe do tema escuro-cinza caso exista
    document.documentElement.classList.remove('theme-escuro-cinza');
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const value = {
    theme,
    setTheme,
    toggleTheme,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};
