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

  useEffect(() => {
    // Salvar a preferência no localStorage
    localStorage.setItem('theme', theme);
    
    // Aplicar ou remover a classe 'dark' no elemento html
    // Tanto 'dark' quanto 'escuro-cinza' devem adicionar a classe 'dark'
    if (theme === 'dark' || theme === 'escuro-cinza') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Adicionar classe específica para o tema escuro-cinza
    if (theme === 'escuro-cinza') {
      document.documentElement.classList.add('theme-escuro-cinza');
    } else {
      document.documentElement.classList.remove('theme-escuro-cinza');
    }
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