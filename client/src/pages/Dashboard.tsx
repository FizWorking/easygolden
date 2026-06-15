import { useAuth } from '../contexts/AuthContext';
import { Upload, Download, ArrowLeftRight, FileSpreadsheet, Building2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import styles from './Dashboard.module.css';

export default function Dashboard() {
  const { connected, company, connect, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) return <div className={styles.center}>Loading...</div>;

  if (!connected) {
    return (
      <div className={styles.welcome}>
        <div className={styles.hero}>
          <FileSpreadsheet size={48} />
          <h1>QB Transaction Manager</h1>
          <p>Import, export, edit, and delete QuickBooks Online transactions — all in one place.</p>
          <button onClick={connect} className={styles.connectBtn}>
            <Building2 size={20} />
            Connect to QuickBooks Online
          </button>
          <div className={styles.helpText}>
            You'll be redirected to Intuit to authorize access to your QuickBooks company.
          </div>
        </div>
        <div className={styles.features}>
          <div className={styles.featureCard}>
            <Upload size={24} />
            <h3>Import</h3>
            <p>Upload Excel, CSV, PDF, or image files and import transactions into QuickBooks.</p>
          </div>
          <div className={styles.featureCard}>
            <Download size={24} />
            <h3>Export</h3>
            <p>Export transactions from QuickBooks to CSV/Excel for reporting and backup.</p>
          </div>
          <div className={styles.featureCard}>
            <ArrowLeftRight size={24} />
            <h3>Manage</h3>
            <p>View, edit, and delete transactions in bulk directly from QuickBooks.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.greeting}>
        <h2>Welcome, {company?.name || 'User'}</h2>
        <p>Select an operation to get started</p>
      </div>
      <div className={styles.cards}>
        <button className={styles.card} onClick={() => navigate('/import')}>
          <Upload size={32} />
          <h3>Import Transactions</h3>
          <p>Upload files and import into QuickBooks</p>
        </button>
        <button className={styles.card} onClick={() => navigate('/export')}>
          <Download size={32} />
          <h3>Export Transactions</h3>
          <p>Download transactions from QuickBooks</p>
        </button>
        <button className={styles.card} onClick={() => navigate('/transactions')}>
          <ArrowLeftRight size={32} />
          <h3>Manage Transactions</h3>
          <p>View, edit, or delete existing transactions</p>
        </button>
      </div>
    </div>
  );
}
