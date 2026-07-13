import { Routes, Route, Navigate } from 'react-router-dom';
import './App.css';
import Layout from '@/components/Layout';
import ProtectedAdminRoute from '@/components/ProtectedAdminRoute';
import FounderLogin from '@/pages/FounderLogin';
import FounderResetPassword from '@/pages/FounderResetPassword';
import Overview from '@/pages/Overview';
import Companies from '@/pages/Companies';
import ClientHealth from '@/pages/Leads';
import UsersPage from '@/pages/Users';
import Analytics from '@/pages/Analytics';
import AIJobs from '@/pages/AIJobs';
import SubscriptionsPage from '@/pages/Subscriptions';
import Support from '@/pages/Support';
import Settings from '@/pages/Settings';
import AIBots from '@/pages/AIBots';
import WhatsAppAutomation from '@/pages/WhatsAppAutomation';
import EmailAutomation from '@/pages/EmailAutomation';
import SalesDashboard from '@/pages/SalesDashboard';
import CustomInternalTools from '@/pages/CustomInternalTools';
import ClientOnboarding from '@/pages/ClientOnboarding';
import LeadGeneration from '@/pages/LeadGeneration';
import Rekha from '@/pages/Rekha';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/admin/overview" replace />} />
      <Route path="/admin/login" element={<FounderLogin />} />
      <Route path="/reset-password" element={<FounderResetPassword />} />
      <Route path="/admin/reset-password" element={<FounderResetPassword />} />

      <Route element={<ProtectedAdminRoute />}>
        <Route path="/admin" element={<Layout />}>
          <Route index element={<Navigate to="/admin/overview" replace />} />
          <Route path="overview" element={<Overview />} />
          <Route path="companies" element={<Companies />} />
          <Route path="client-onboarding" element={<ClientOnboarding />} />
          <Route path="client-health" element={<ClientHealth />} />
          <Route path="lead-generation" element={<LeadGeneration />} />
          <Route path="rekha" element={<Rekha />} />
          <Route path="leads" element={<Navigate to="/admin/client-health" replace />} />
          <Route path="users" element={<UsersPage />} />
          <Route path="analytics" element={<Analytics />} />
          <Route path="ai-jobs" element={<AIJobs />} />
          <Route path="subscriptions" element={<SubscriptionsPage />} />
          <Route path="support" element={<Support />} />
          <Route path="settings" element={<Settings />} />
          <Route path="ai-chatbots" element={<AIBots />} />
          <Route path="whatsapp-automation" element={<WhatsAppAutomation />} />
          <Route path="email-automation" element={<EmailAutomation />} />
          <Route path="sales-dashboard" element={<SalesDashboard />} />
          <Route path="custom-tools" element={<CustomInternalTools />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/admin/overview" replace />} />
    </Routes>
  );
}
