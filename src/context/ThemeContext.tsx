import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'escuro-cinza';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // Verificar se há uma preferência salva no localStorage
    const savedTheme = localStorage.getItem('theme') as Theme;
    if (savedTheme) {
      return savedTheme;
    }
    
    // Para novos usuários, definir tema escuro como padrão
    return 'dark';
  });

  // Aplicar tema imediatamente quando o componente monta
  useEffect(() => {
    const applyTheme = (currentTheme: Theme) => {
      const htmlElement = document.documentElement;
      
      // Remover todas as classes de tema primeiro
      htmlElement.classList.remove('dark', 'theme-escuro-cinza');
      
      // Aplicar classes baseadas no tema atual
      if (currentTheme === 'dark' || currentTheme === 'escuro-cinza') {
        htmlElement.classList.add('dark');
      }
      
      if (currentTheme === 'escuro-cinza') {
        htmlElement.classList.add('theme-escuro-cinza');
      }
      
      // Salvar a preferência no localStorage
      localStorage.setItem('theme', currentTheme);
    };

    applyTheme(theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prevTheme => {
      if (prevTheme === 'light') return 'dark';
      if (prevTheme === 'dark') return 'escuro-cinza';
      return 'light';
    });
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