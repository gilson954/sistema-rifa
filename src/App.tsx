import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateCampaignPage from './pages/CreateCampaignPage';
import PaymentIntegrationsPage from './pages/PaymentIntegrationsPage';
import RankingPage from './pages/RankingPage';
import AffiliationsPage from './pages/AffiliationsPage';
import AffiliatesManagementPage from './pages/AffiliatesManagementPage';
import AffiliateAreaPage from './pages/AffiliateAreaPage';
import PixelsAnalyticsPage from './pages/PixelsAnalyticsPage';
import CustomizationPage from './pages/CustomizationPage';
import AccountPage from './pages/AccountPage';
import SocialMediaPage from './pages/SocialMediaPage';
import TutorialsPage from './pages/TutorialsPage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>

          {/* Rotas de Autenticação */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Rota de Login Administrativo */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Dashboard Protegido */}
          <Route path="/dashboard" element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }>
            <Route index element={<DashboardPage />} />
            <Route path="create-campaign" element={<CreateCampaignPage />} />
            <Route path="integrations" element={<PaymentIntegrationsPage />} />
            <Route path="ranking" element={<RankingPage />} />
            <Route path="affiliations" element={<AffiliationsPage />} />
            <Route path="affiliations/manage" element={<AffiliatesManagementPage />} />
            <Route path="affiliations/area" element={<AffiliateAreaPage />} />
            <Route path="social-media" element={<SocialMediaPage />} />
            <Route path="analytics" element={<PixelsAnalyticsPage />} />
            <Route path="customize" element={<CustomizationPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="tutorials" element={<TutorialsPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;