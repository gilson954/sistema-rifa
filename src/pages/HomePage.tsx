import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRouteHistory } from '../hooks/useRouteHistory';
import Hero from '../components/Hero';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { restoreLastRoute } = useRouteHistory();

  useEffect(() => {
    if (!loading && user) {
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

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (user) {
    return null;
  }

  return (
    <>
      <Hero />
      <FAQ />
      <Footer />
    </>
  );
};

export default HomePage;
