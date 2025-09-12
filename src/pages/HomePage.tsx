import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRouteHistory } from '../hooks/useRouteHistory';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { restoreLastRoute } = useRouteHistory();

  useEffect(() => {
    // Se o usuário estiver logado e não estiver carregando
    if (!loading && user) {
      // Verifica se há uma rota para restaurar
      const lastRoute = restoreLastRoute();
      
      // Se há uma rota salva, navega para ela
      if (lastRoute) {
        navigate(lastRoute, { replace: true });
        return;
      }
      
      // Se há um estado 'from' (vindo de uma rota protegida), navega para lá
      const from = location.state?.from;
      if (from && typeof from === 'string') {
        navigate(from, { replace: true });
        return;
      }
      
      // Caso contrário, vai para o dashboard
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate, location.state, restoreLastRoute]);

  // Mostra loading enquanto verifica o status de autenticação
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Se o usuário estiver logado, não renderiza a página inicial (será redirecionado)
  if (user) {
    return null;
  }

  return (
    <>
      <Hero />
      <HowItWorks />
      <Features />
      <FAQ />
      <Footer />
    </>
  );
};

export default HomePage;