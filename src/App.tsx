import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import ProtectedRoute from './components/ProtectedRoute';
import AdminProtectedRoute from './components/AdminProtectedRoute';
import HomePage from './pages/HomePage';
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
import AffiliationsPage from './pages/AffiliationsPage';
import AffiliatesManagementPage from './pages/AffiliatesManagementPage';
import AffiliateAreaPage from './pages/AffiliateAreaPage';
import PixelsAnalyticsPage from './pages/PixelsAnalyticsPage';
import CustomizationPage from './pages/CustomizationPage';
import AccountPage from './pages/AccountPage';
import SocialMediaPage from './pages/SocialMediaPage';
import TutorialsPage from './pages/TutorialsPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import AdminSuggestionsPage from './pages/AdminSuggestionsPage';
import MyTicketsPage from './pages/MyTicketsPage';
import PaymentSuccessPage from './pages/PaymentSuccessPage';
import PaymentCancelledPage from './pages/PaymentCancelledPage';
import SalesHistoryPage from './pages/SalesHistoryPage';
import SuggestionsPage from './pages/SuggestionsPage';
import MultiStepFormContainer from './components/MultiStepFormContainer';
import { MultiStepFormProvider } from './context/MultiStepFormContext';
import { initialFormData } from './lib/validations/formSteps';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import RealizarSorteioPage from './pages/RealizarSorteioPage';
import GanhadoresPage from './pages/GanhadoresPage';
import DetalhesGanhadorPage from './pages/DetalhesGanhadorPage';
import OrganizerHomePage from './pages/OrganizerHomePage';
import EmailConfirmationSuccessPage from './pages/EmailConfirmationSuccessPage';
import { supabase } from './lib/supabase';

// Componente interno para gerenciar favicon e título dinâmicos
function DynamicPageMetadata() {
  const location = useLocation();

  useEffect(() => {
    const updateFaviconAndTitle = async () => {
      const pathname = location.pathname;
      const faviconElement = document.getElementById('favicon') as HTMLLinkElement;
      const defaultFavicon = '/logo-chatgpt.png';
      
      // Resetar para favicon padrão
      if (faviconElement) {
        faviconElement.href = defaultFavicon;
      }

      // Página de Campanha - /c/:publicId
      if (pathname.startsWith('/c/')) {
        const publicId = pathname.split('/c/')[1];
        
        try {
          // Buscar campanha e informações do organizador
          const { data: campaign, error: campaignError } = await supabase
            .from('campaigns')
            .select('title, user_id')
            .eq('public_id', publicId)
            .single();

          if (campaign && !campaignError) {
            // Atualizar título da página
            document.title = `${campaign.title} - Rifaqui`;

            // Buscar logo do organizador
            const { data: profile, error: profileError } = await supabase
              .from('public_profiles')
              .select('logo_url')
              .eq('user_id', campaign.user_id)
              .single();

            if (profile && !profileError && profile.logo_url && faviconElement) {
              faviconElement.href = profile.logo_url;
            }
          } else {
            document.title = 'Campanha - Rifaqui';
          }
        } catch (error) {
          console.error('Erro ao buscar dados da campanha:', error);
          document.title = 'Campanha - Rifaqui';
        }
      }
      // Página do Organizador - /org/:userId
      else if (pathname.startsWith('/org/')) {
        const userId = pathname.split('/org/')[1];
        
        try {
          // Buscar informações do organizador
          const { data: profile, error: profileError } = await supabase
            .from('public_profiles')
            .select('name, logo_url')
            .eq('user_id', userId)
            .single();

          // Atualizar título da página para "Campanha"
          document.title = 'Campanha';

          // Atualizar favicon com o logo do organizador
          if (profile && !profileError && profile.logo_url && faviconElement) {
            faviconElement.href = profile.logo_url;
          }
        } catch (error) {
          console.error('Erro ao buscar dados do organizador:', error);
          document.title = 'Campanha';
        }
      }
      // Página Minhas Cotas
      else if (pathname === '/my-tickets') {
        document.title = 'Minhas Cotas - Rifaqui';
      }
      // Página de Confirmação de Pagamento
      else if (pathname === '/payment-confirmation') {
        document.title = 'Confirmação de Pagamento - Rifaqui';
      }
      // Página de Sucesso de Pagamento
      else if (pathname === '/payment-success') {
        document.title = 'Pagamento Confirmado - Rifaqui';
      }
      // Página de Pagamento Cancelado
      else if (pathname === '/payment-cancelled') {
        document.title = 'Pagamento Cancelado - Rifaqui';
      }
      // Dashboard
      else if (pathname.startsWith('/dashboard')) {
        if (pathname === '/dashboard') {
          document.title = 'Dashboard - Rifaqui';
        } else if (pathname.includes('/create-campaign')) {
          document.title = 'Criar Campanha - Rifaqui';
        } else if (pathname.includes('/integrations')) {
          document.title = 'Integrações de Pagamento - Rifaqui';
        } else if (pathname.includes('/affiliations')) {
          document.title = 'Afiliações - Rifaqui';
        } else if (pathname.includes('/social-media')) {
          document.title = 'Redes Sociais - Rifaqui';
        } else if (pathname.includes('/analytics')) {
          document.title = 'Pixels e Analytics - Rifaqui';
        } else if (pathname.includes('/customize')) {
          document.title = 'Personalização - Rifaqui';
        } else if (pathname.includes('/account')) {
          document.title = 'Minha Conta - Rifaqui';
        } else if (pathname.includes('/tutorials')) {
          document.title = 'Tutoriais - Rifaqui';
        } else if (pathname.includes('/suggestions')) {
          document.title = 'Sugestões - Rifaqui';
        } else if (pathname.includes('/sales-history')) {
          document.title = 'Histórico de Vendas - Rifaqui';
        } else if (pathname.includes('/realizar-sorteio')) {
          document.title = 'Realizar Sorteio - Rifaqui';
        } else if (pathname.includes('/ganhadores')) {
          document.title = 'Ganhadores - Rifaqui';
        }
      }
      // Admin
      else if (pathname.startsWith('/admin')) {
        if (pathname === '/admin/dashboard') {
          document.title = 'Admin Dashboard - Rifaqui';
        } else if (pathname === '/admin/suggestions') {
          document.title = 'Admin Sugestões - Rifaqui';
        } else if (pathname === '/admin/login') {
          document.title = 'Admin Login - Rifaqui';
        }
      }
      // Páginas de Autenticação
      else if (pathname === '/login') {
        document.title = 'Login - Rifaqui';
      } else if (pathname === '/register') {
        document.title = 'Cadastro - Rifaqui';
      } else if (pathname === '/forgot-password') {
        document.title = 'Recuperar Senha - Rifaqui';
      } else if (pathname === '/reset-password') {
        document.title = 'Redefinir Senha - Rifaqui';
      } else if (pathname === '/email-confirmation-success') {
        document.title = 'E-mail Confirmado - Rifaqui';
      }
      // Página Inicial
      else if (pathname === '/') {
        document.title = 'Rifaqui';
      }
      // Fallback
      else {
        document.title = 'Rifaqui';
      }
    };

    updateFaviconAndTitle();
  }, [location]);

  return null;
}

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <Router>
          <DynamicPageMetadata />
          <Routes>
          {/* Rotas Públicas */}
          <Route path="/" element={<Layout />}>
            <Route index element={<HomePage />} />
          </Route>

          {/* Rotas de Autenticação */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />

          {/* Rota para Sucesso de Confirmação de E-mail */}
          <Route
            path="/email-confirmation-success"
            element={<EmailConfirmationSuccessPage />}
          />

          {/* Página Pública de Campanha */}
          <Route path="/c/:publicId" element={<CampaignPage />} />

          {/* Página Inicial do Organizador */}
          <Route path="/org/:userId" element={<OrganizerHomePage />} />

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

          {/* Admin Suggestions Protegido */}
          <Route
            path="/admin/suggestions"
            element={
              <AdminProtectedRoute>
                <AdminSuggestionsPage />
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
            <Route path="affiliations" element={<AffiliationsPage />} />
            <Route path="affiliations/manage" element={<AffiliatesManagementPage />} />
            <Route path="affiliations/area" element={<AffiliateAreaPage />} />
            <Route path="social-media" element={<SocialMediaPage />} />
            <Route path="analytics" element={<PixelsAnalyticsPage />} />
            <Route path="customize" element={<CustomizationPage />} />
            <Route path="account" element={<AccountPage />} />
            <Route path="tutorials" element={<TutorialsPage />} />
            <Route path="suggestions" element={<SuggestionsPage />} />
            <Route
              path="campaigns/:campaignId/sales-history"
              element={<SalesHistoryPage />}
            />
            <Route
              path="campaigns/:campaignId/realizar-sorteio"
              element={<RealizarSorteioPage />}
            />
            <Route
              path="campaigns/:campaignId/ganhadores"
              element={<GanhadoresPage />}
            />
            <Route
              path="campaigns/:campaignId/ganhador/:winnerId"
              element={<DetalhesGanhadorPage />}
            />
          </Route>
        </Routes>
        </Router>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;