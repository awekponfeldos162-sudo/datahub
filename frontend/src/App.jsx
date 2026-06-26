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
import Admin from './pages/Admin';

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
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/signup" element={<PublicRoute><Signup /></PublicRoute>} />

        <Route path="/" element={<PrivateRoute><AppLayout /></PrivateRoute>}>
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="analytics/:platform" element={<Analytics />} />
          <Route path="compare" element={<Compare />} />
          <Route path="reports" element={<Reports />} />
          <Route path="insights" element={<Insights />} />
          <Route path="settings" element={<Settings />} />
          <Route path="heatmap" element={<Heatmap />} />
          <Route path="admin" element={<Admin />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
