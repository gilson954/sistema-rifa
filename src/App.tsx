import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardLayout from './components/DashboardLayout';
import HomePage from './pages/HomePage';
import DashboardPage from './pages/DashboardPage';
import CampaignsPage from './pages/CampaignsPage';
import ConfigurePixPage from './pages/ConfigurePixPage';
import SocialMediaPage from './pages/SocialMediaPage';
import AnalyticsPage from './pages/AnalyticsPage';
import CustomizePage from './pages/CustomizePage';
import AccountPage from './pages/AccountPage';
import SupportPage from './pages/SupportPage';

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
          <Route path="campaigns" element={<CampaignsPage />} />
          <Route path="configure-pix" element={<ConfigurePixPage />} />
          <Route path="social-media" element={<SocialMediaPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="customize" element={<CustomizePage />} />
          <Route path="account" element={<AccountPage />} />
          <Route path="support" element={<SupportPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;