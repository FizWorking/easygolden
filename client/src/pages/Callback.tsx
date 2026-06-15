import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuthStatus } from '../api/client';
import styles from './Dashboard.module.css';

export default function Callback() {
  const navigate = useNavigate();

  useEffect(() => {
    getAuthStatus()
      .then((status) => {
        if (status.connected) {
          navigate('/dashboard', { replace: true });
        } else {
          navigate('/', { replace: true });
        }
      })
      .catch(() => {
        navigate('/', { replace: true });
      });
  }, [navigate]);

  return (
    <div className={styles.center}>
      Authenticating with QuickBooks...
    </div>
  );
}
