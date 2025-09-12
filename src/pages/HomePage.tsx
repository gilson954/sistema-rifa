import React, { useEffect, useState } from 'react'; // Importe useState
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRouteHistory } from '../hooks/useRouteHistory';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
// import Features from '../components/Features';  // removido temporariamente
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { restoreLastRoute } = useRouteHistory();
  const [redirecting, setRedirecting] = useState(false); // Novo estado

  useEffect(() => {
    if (!loading && user) {
      setRedirecting(true); // Define o estado de redirecionamento como true
      const lastRoute = restoreLastRoute();
      if (lastRoute) {
        navigate(lastRoute, { replace: true });
        return;
      }
      const from = location.state?.from;
      if (from && typeof from === 'string') {
        navigate(from, { replace: true });
        return;
      }
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate, location.state, restoreLastRoute]);

  if (loading || redirecting) { // Mostra o spinner se estiver carregando ou redirecionando
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  // Se não estiver carregando, não estiver redirecionando e o usuário NÃO estiver logado, renderiza a landing page
  return (
    <>
      <Hero />
      <HowItWorks />
      {/* <Features /> removido */}
      <FAQ />
      <Footer />
    </>
  );
};

export default HomePage;