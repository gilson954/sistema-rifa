import React from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import LoginPage from './pages/LoginPage';
import AdminLoginPage from './pages/AdminLoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateCampaignStep1Page from './pages/CreateCampaignStep1Page';
import CreateCampaignStep2Page from './pages/CreateCampaignStep2Page';
import CreateCampaignStep3Page from './pages/CreateCampaignStep3Page';
import CampaignPage from './pages/CampaignPage';
import PaymentConfirmationPage from './pages/PaymentConfirmationPage';
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
import AdminDashboardPage from './pages/AdminDashboardPage';
import MyTicketsPage from './pages/MyTicketsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelledPage from './pages/PaymentCancelledPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import MultiStepFormContainer from './components/MultiStepFormContainer';
import { MultiStepFormProvider } from './context/MultiStepFormContext';
import { initialFormData } from './lib/validations/formSteps';
import HomePage from './pages/HomePage';

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Página inicial */}
          <Route path="/" element={<HomePage />} />

          {/* Rotas de Autenticação */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          {/* Página Pública de Campanha */}
          <Route path="/c/:slug" element={<CampaignPage />} />

          {/* Página de Confirmação de Pagamento */}
          <Route path="/payment-confirmation" element={<PaymentConfirmationPage />} />

          {/* Páginas de Resultado de Pagamento Stripe */}
          <Route path="/payment-success" element={<PaymentSuccessPage />} />
          <Route path="/payment-cancelled" element={<PaymentCancelledPage />} />

          {/* Página Minhas Cotas */}
          <Route path="/my-tickets" element={<MyTicketsPage />} />

          {/* Rota de Login Administrativo */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Admin Dashboard Protegido */}
          <Route
            path="/admin/dashboard"
            element={
              <AdminProtectedRoute>
                <AdminDashboardPage />
              </AdminProtectedRoute>
            }
          />

          {/* Dashboard Protegido */}
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="create-campaign" element={<CreateCampaignStep1Page />} />
            <Route path="create-campaign/step-2" element={<CreateCampaignStep2Page />} />
            <Route path="create-campaign/step-3" element={<CreateCampaignStep3Page />} />
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
            <Route path="campaigns/:campaignId/sales-history" element={<SalesHistoryPage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
