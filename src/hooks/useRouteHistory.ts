import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

const ROUTE_STORAGE_KEY = 'rifaqui_last_route';
const ROUTE_TIMESTAMP_KEY = 'rifaqui_route_timestamp';

// Tempo limite para considerar uma rota válida (30 minutos)
const ROUTE_EXPIRY_TIME = 30 * 60 * 1000;

export const useRouteHistory = () => {
  const location = useLocation();

  // Salva a rota atual no localStorage
  const saveCurrentRoute = (pathname: string) => {
    try {
      localStorage.setItem(ROUTE_STORAGE_KEY, pathname);
      localStorage.setItem(ROUTE_TIMESTAMP_KEY, Date.now().toString());
    } catch (error) {
      console.warn('Failed to save route to localStorage:', error);
}
  };

  // Recupera a última rota salva
  const getLastRoute = (): string | null => {
    try {
      const savedRoute = localStorage.getItem(ROUTE_STORAGE_KEY);
      const timestamp = localStorage.getItem(ROUTE_TIMESTAMP_KEY);
      
      if (!savedRoute || !timestamp) {
        return null;
      }

      const routeAge = Date.now() - parseInt(timestamp);
      
      // Se a rota é muito antiga, ignore
      if (routeAge > ROUTE_EXPIRY_TIME) {
        clearRouteHistory();
        return null;
      }

      return savedRoute;
    } catch (error) {
      console.warn('Failed to retrieve route from localStorage:', error);
      return null;
    }
  };

  // Limpa o histórico de rotas
  const clearRouteHistory = () => {
    try {
      localStorage.removeItem(ROUTE_STORAGE_KEY);
      localStorage.removeItem(ROUTE_TIMESTAMP_KEY);
    } catch (error) {
      console.warn('Failed to clear route history:', error);
    }
  };

  // Restaura a última rota se aplicável
  const restoreLastRoute = () => {
    const lastRoute = getLastRoute();
    
    if (lastRoute && lastRoute !== location.pathname) {
      // Só restaura se não estiver em uma página de auth
      const isAuthPage = ['/login', '/register', '/admin/login'].includes(location.pathname);
      const isHomePage = location.pathname === '/';
      
      if (!isAuthPage && !isHomePage) {
        return lastRoute;
      }
    }
    
    return null;
  };

  // Salva a rota atual sempre que ela mudar
  useEffect(() => {
    // Não salva rotas de autenticação ou página inicial
    const shouldSaveRoute = !['/login', '/register', '/admin/login', '/'].includes(location.pathname);
    
    if (shouldSaveRoute) {
      saveCurrentRoute(location.pathname);
    }
  }, [location.pathname]);

  return {
    saveCurrentRoute,
    getLastRoute,
    clearRouteHistory,
    restoreLastRoute
  };
};
