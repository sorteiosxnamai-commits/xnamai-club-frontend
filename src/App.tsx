import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Protected } from './components/Protected';
import { AdminShell } from './components/AdminShell';
import { Home } from './pages/Home';
import { Plans } from './pages/Plans';
import { Rules } from './pages/Rules';
import { Simulator } from './pages/Simulator';
import { AuthPage } from './pages/AuthPage';
import { ForgotPasswordPage, ResetPasswordPage } from './pages/PasswordRecovery';
import { Checkout } from './pages/Checkout';
import { Confirmation } from './pages/Confirmation';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminSubscriptions } from './pages/AdminSubscriptions';
import { AdminPayments } from './pages/AdminPayments';
import { AdminCustomers } from './pages/AdminCustomers';
import { Atendimento } from './pages/Atendimento';
import { SiteFooter } from './components/SiteFooter';
import { VercelTelemetry } from './components/VercelTelemetry';
import { ContentProvider } from './content/ContentContext';
import { AdminContent } from './pages/AdminContent';
import { ContentPreview } from './pages/ContentPreview';
import { BusinessProfile } from './pages/BusinessProfile';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ContentProvider>
        <VercelTelemetry />
        <div className="app-shell">
          <div className="app-shell-main">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/planos" element={<Plans />} />
              <Route path="/regras" element={<Rules />} />
              <Route path="/simulador" element={<Simulator />} />
              <Route path="/login" element={<AuthPage mode="login" />} />
              <Route path="/esqueci-senha" element={<ForgotPasswordPage />} />
              <Route path="/redefinir-senha" element={<ResetPasswordPage />} />
              <Route path="/cadastro" element={<AuthPage mode="register" />} />
              <Route path="/atendimento" element={<Atendimento />} />
              <Route path="/admin/previa/:screen" element={<Protected role="ADMIN"><ContentPreview /></Protected>} />
              <Route path="/checkout" element={<Protected role="CUSTOMER"><Checkout /></Protected>} />
              <Route path="/confirmacao" element={<Protected role="CUSTOMER"><Confirmation /></Protected>} />
              <Route path="/app" element={<Protected role="CUSTOMER"><CustomerDashboard /></Protected>} />
              <Route path="/app/cadastro-empresa" element={<Protected role="CUSTOMER"><BusinessProfile /></Protected>} />
              <Route path="/admin" element={<Protected role="ADMIN"><AdminShell /></Protected>}>
                <Route index element={<AdminDashboard />} />
                <Route path="assinaturas" element={<AdminSubscriptions />} />
                <Route path="cobrancas" element={<AdminPayments />} />
                <Route path="clientes" element={<AdminCustomers />} />
                <Route path="conteudo" element={<AdminContent />} />
              </Route>
            </Routes>
          </div>
          <SiteFooter />
        </div>
        </ContentProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
