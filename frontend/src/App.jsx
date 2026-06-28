import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useStore';
import AppLayout from './components/layout/AppLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Analytics from './pages/Analytics';
import Compare from './pages/Compare';
import Reports from './pages/Reports';
import Insights from './pages/Insights';
import Settings from './pages/Settings';
import Pricing from './pages/Pricing';
import Heatmap from './pages/Heatmap';
import AuthCallback from './pages/AuthCallback';
import PaymentCallback from './pages/PaymentCallback';
import ResetPassword from './pages/ResetPassword';
import VerifyEmail from './pages/VerifyEmail';
import ForgotPassword from './pages/ForgotPassword';
import Privacy from './pages/Privacy';
import NotFound from './pages/NotFound';

function PrivateRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return isAuthenticated ? children : <Navigate to="/login" replace />;
}

function PublicRoute({ children }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return !isAuthenticated ? children : <Navigate to="/dashboard" replace />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        {/* Auth & payment callbacks */}
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Pricing accessible without auth */}
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />

        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics/:platform" element={<Analytics />} />
          <Route path="compare" element={<Compare />} />
          <Route path="reports" element={<Reports />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings" element={<Settings />} />
          <Route path="heatmap" element={<Heatmap />} />
        </Route>

        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
