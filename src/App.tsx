import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
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
    <Router>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
        </Route>

        {/* Dashboard */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardPage />} />
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
  );
}

export default App;