import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Import from './pages/Import';
import Export from './pages/Export';
import Transactions from './pages/Transactions';
import Callback from './pages/Callback';
import styles from './App.module.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { connected, loading } = useAuth();
  if (loading) return <div className={styles.loading}>Loading...</div>;
  if (!connected) return <Navigate to="/" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="callback" element={<Callback />} />
        <Route
          path="import"
          element={
            <ProtectedRoute>
              <Import />
            </ProtectedRoute>
          }
        />
        <Route
          path="export"
          element={
            <ProtectedRoute>
              <Export />
            </ProtectedRoute>
          }
        />
        <Route
          path="transactions"
          element={
            <ProtectedRoute>
              <Transactions />
            </ProtectedRoute>
          }
        />
      </Route>
    </Routes>
  );
}
