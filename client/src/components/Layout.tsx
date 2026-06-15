import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Upload, Download, ArrowLeftRight, LayoutDashboard, LogOut, Building2 } from 'lucide-react';
import styles from './Layout.module.css';

export default function Layout() {
  const { connected, company, disconnect } = useAuth();
  const navigate = useNavigate();

  const handleDisconnect = async () => {
    await disconnect();
    navigate('/');
  };

  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.headerLeft}>
          <h1 className={styles.logo}>QB Transaction Manager</h1>
          <nav className={styles.nav}>
            <NavLink to="/" end className={({ isActive }) => isActive ? styles.active : ''}>
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            {connected && (
              <>
                <NavLink to="/import" className={({ isActive }) => isActive ? styles.active : ''}>
                  <Upload size={18} />
                  Import
                </NavLink>
                <NavLink to="/export" className={({ isActive }) => isActive ? styles.active : ''}>
                  <Download size={18} />
                  Export
                </NavLink>
                <NavLink to="/transactions" className={({ isActive }) => isActive ? styles.active : ''}>
                  <ArrowLeftRight size={18} />
                  Transactions
                </NavLink>
              </>
            )}
          </nav>
        </div>
        <div className={styles.headerRight}>
          {connected && company && (
            <span className={styles.company}>
              <Building2 size={16} />
              {company.name}
            </span>
          )}
          {connected && (
            <button onClick={handleDisconnect} className={styles.logoutBtn}>
              <LogOut size={16} />
              Disconnect
            </button>
          )}
        </div>
      </header>
      <main className={styles.main}>
        <Outlet />
      </main>
    </div>
  );
}
