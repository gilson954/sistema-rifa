import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Se o usuário estiver logado e não estiver carregando, redireciona para o dashboard
    if (!loading && user) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, loading, navigate]);

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