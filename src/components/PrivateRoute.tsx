import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const { isAuthenticated, isInitialAuthCheckDone } = useAuth();
  const location = useLocation();

  console.log('PrivateRoute: Estado atual:', {
    isAuthenticated,
    isInitialAuthCheckDone,
    pathname: location.pathname
  });

  // Mostrar loading enquanto verifica autenticação inicial
  if (!isInitialAuthCheckDone) {
    console.log('PrivateRoute: Mostrando loading - verificação inicial não concluída');
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center transition-colors duration-300">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 border-t-purple-600 dark:border-t-purple-400 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300 font-medium">Verificando autenticação...</p>
        </div>
      </div>
    );
  }

  // Se não estiver autenticado, redirecionar para login
  if (!isAuthenticated) {
    console.log('PrivateRoute: Usuário não autenticado, redirecionando para login');
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Se estiver autenticado, renderizar o conteúdo
  console.log('PrivateRoute: Usuário autenticado, renderizando conteúdo');
  return <>{children}</>;
};

export default PrivateRoute;