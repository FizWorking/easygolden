import { useState, useEffect, useCallback } from 'react';
import toast from 'react-hot-toast';
import { getTransactionTypes, getTransactions, deleteTransactions } from '../api/client';
import type { TransactionType } from '../types';
import { Search, Trash2, AlertCircle, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import styles from './Transactions.module.css';

export default function Transactions() {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [selectedType, setSelectedType] = useState<string>('Invoice');
  const [transactions, setTransactions] = useState<Record<string, unknown>[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [deleting, setDeleting] = useState(false);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  useEffect(() => {
    getTransactionTypes().then(setTypes).catch(() => {});
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getTransactions(selectedType);
      setTransactions(data.results);
      setTotalCount(data.totalCount);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error('Failed to load transactions');
    } finally {
      setLoading(false);
    }
  }, [selectedType]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => String(t.Id))));
    }
  };

  const handleDelete = async () => {
    if (selectedIds.size === 0) return;
    if (!confirm(`Delete ${selectedIds.size} selected transactions? This cannot be undone.`)) return;

    setDeleting(true);
    try {
      const items = transactions
        .filter((t) => selectedIds.has(String(t.Id)))
        .map((t) => ({
          type: selectedType,
          id: String(t.Id),
          syncToken: String(t.SyncToken || '0'),
        }));

      const result = await deleteTransactions(items);
      if (result.failureCount > 0) {
        toast.error(`Deleted ${result.successCount}, but ${result.failureCount} failed`);
      } else {
        toast.success(`Deleted ${result.successCount} transactions`);
      }
      fetchTransactions();
    } catch (err) {
      toast.error('Delete failed');
    } finally {
      setDeleting(false);
    }
  };

  const displayFields = ['DocNumber', 'TxnDate', 'TotalAmt', 'CustomerRef', 'VendorRef', 'Balance'];

  return (
    <div className={styles.page}>
      <div className={styles.topBar}>
        <div>
          <h2>Manage Transactions</h2>
          <p className={styles.subtitle}>View, search, and delete QuickBooks transactions</p>
        </div>
        <div className={styles.topActions}>
          <button onClick={fetchTransactions} className={styles.refreshBtn} disabled={loading}>
            <RefreshCw size={16} className={loading ? styles.spin : ''} />
            Refresh
          </button>
          {selectedIds.size > 0 && (
            <button onClick={handleDelete} disabled={deleting} className={styles.deleteBtn}>
              <Trash2 size={16} />
              {deleting ? 'Deleting...' : `Delete (${selectedIds.size})`}
            </button>
          )}
        </div>
      </div>

      <div className={styles.filters}>
        <div className={styles.typeTabs}>
          {types.slice(0, 8).map((type) => (
            <button
              key={type}
              onClick={() => { setSelectedType(type); setPage(1); }}
              className={`${styles.typeTab} ${selectedType === type ? styles.typeTabActive : ''}`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {loading && transactions.length === 0 ? (
        <div className={styles.center}>Loading transactions...</div>
      ) : transactions.length === 0 ? (
        <div className={styles.center}>
          <Search size={24} />
          <p>No {selectedType} transactions found</p>
        </div>
      ) : (
        <div className={styles.tableCard}>
          <div className={styles.tableHeader}>
            <span>{totalCount} {selectedType}(s) found</span>
            {selectedIds.size > 0 && (
              <span className={styles.selectedCount}>{selectedIds.size} selected</span>
            )}
          </div>
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th className={styles.checkCol}>
                    <input
                      type="checkbox"
                      checked={selectedIds.size === transactions.length && transactions.length > 0}
                      onChange={toggleSelectAll}
                    />
                  </th>
                  <th>ID</th>
                  {displayFields.map((f) => (
                    <th key={f}>{f}</th>
                  ))}
                  <th>SyncToken</th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => {
                  const id = String(tx.Id);
                  const ref = tx.CustomerRef as Record<string, unknown> | undefined
                    || tx.VendorRef as Record<string, unknown> | undefined;
                  return (
                    <tr
                      key={id}
                      className={selectedIds.has(id) ? styles.rowSelected : ''}
                      onClick={() => toggleSelect(id)}
                    >
                      <td className={styles.checkCol} onClick={(e) => e.stopPropagation()}>
                        <input
                          type="checkbox"
                          checked={selectedIds.has(id)}
                          onChange={() => toggleSelect(id)}
                        />
                      </td>
                      <td className={styles.idCol}>{id}</td>
                      <td>{String(tx.DocNumber || '')}</td>
                      <td>{String(tx.TxnDate || '')}</td>
                      <td>{tx.TotalAmt != null ? Number(tx.TotalAmt).toFixed(2) : ''}</td>
                      <td>{ref?.name as string || ''}</td>
                      <td>{tx.Balance != null ? Number(tx.Balance).toFixed(2) : ''}</td>
                      <td className={styles.syncCol}>{String(tx.SyncToken || '0')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
