import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useRouteHistory } from '../hooks/useRouteHistory';
import Hero from '../components/Hero';
import HowItWorks from '../components/HowItWorks';
import Features from '../components/Features';
import FAQ from '../components/FAQ';
import Footer from '../components/Footer';
import { motion } from 'framer-motion';

const HomePage = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { restoreLastRoute } = useRouteHistory();

  useEffect(() => {
    if (!loading && user) {
      if (location.pathname === '/reset-password') return;

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
  }, [user, loading, navigate, location.state, restoreLastRoute, location.pathname]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-950">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-purple-400"></div>
      </div>
    );
  }

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-gray-950">
        <div className="animate-spin rounded-full h-20 w-20 border-t-2 border-purple-400"></div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-animated-gradient dark:bg-animated-gradient-dark text-gray-900 dark:text-gray-100 overflow-x-hidden">
      {/* soft overlay to lift content from background */}
      <div className="absolute inset-0 bg-black/6 dark:bg-black/30 backdrop-blur-[2px]" />

      <main className="relative z-10 flex flex-col items-center">
        <motion.section
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Hero />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          viewport={{ once: true }}
          className="w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <HowItWorks />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: true }}
          className="w-full"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Features />
          </div>
        </motion.section>

        <motion.section
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          viewport={{ once: true }}
          className="w-full"
        >
          {/* IMPORTANT: FAQ width unified here (max-w-7xl) — antes estava em 4xl */}
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <FAQ />
          </div>
        </motion.section>

        <motion.footer
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="w-full mt-16"
        >
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <Footer />
          </div>
        </motion.footer>
      </main>
    </div>
  );
};

export default HomePage;
