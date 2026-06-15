import { useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { getTransactionTypes, exportTransactions } from '../api/client';
import type { TransactionType } from '../types';
import { Download, FileSpreadsheet } from 'lucide-react';
import styles from './Export.module.css';

export default function Export() {
  const [types, setTypes] = useState<TransactionType[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [format, setFormat] = useState<'csv' | 'json'>('csv');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [exporting, setExporting] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    getTransactionTypes().then(setTypes).catch(() => toast.error('Failed to load types'));
  }, []);

  const toggleType = (type: string) => {
    const next = new Set(selected);
    if (next.has(type)) next.delete(type);
    else next.add(type);
    setSelected(next);
  };

  const selectAll = () => setSelected(new Set(types));
  const clearAll = () => setSelected(new Set());

  const handleExport = async () => {
    if (selected.size === 0) {
      toast.error('Select at least one transaction type');
      return;
    }
    setExporting(true);
    try {
      const result = await exportTransactions({
        types: Array.from(selected),
        format,
        startDate: dateRange.start || undefined,
        endDate: dateRange.end || undefined,
      });

      if (format === 'csv' && result instanceof Blob) {
        const url = URL.createObjectURL(result);
        const a = document.createElement('a');
        a.href = url;
        a.download = `qbo-export-${Date.now()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success('Export downloaded');
      } else if (typeof result === 'object' && 'count' in result) {
        setCount(result.count);
        toast.success(`${result.count} transactions ready`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Export failed');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className={styles.page}>
      <h2>Export Transactions</h2>
      <p className={styles.subtitle}>Export transactions from QuickBooks to CSV or JSON</p>

      <div className={styles.card}>
        <h3>Select Transaction Types</h3>
        <div className={styles.actions}>
          <button onClick={selectAll} className={styles.linkBtn}>Select All</button>
          <button onClick={clearAll} className={styles.linkBtn}>Clear All</button>
          <span className={styles.count}>{selected.size} selected</span>
        </div>
        <div className={styles.grid}>
          {types.map((type) => (
            <label key={type} className={`${styles.chip} ${selected.has(type) ? styles.chipActive : ''}`}>
              <input
                type="checkbox"
                checked={selected.has(type)}
                onChange={() => toggleType(type)}
              />
              {type}
            </label>
          ))}
        </div>
      </div>

      <div className={styles.card}>
        <h3>Date Range (Optional)</h3>
        <div className={styles.dateRow}>
          <label>
            From
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange(p => ({ ...p, start: e.target.value }))}
            />
          </label>
          <label>
            To
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange(p => ({ ...p, end: e.target.value }))}
            />
          </label>
        </div>
      </div>

      <div className={styles.card}>
        <h3>Export Format</h3>
        <div className={styles.formatRow}>
          <label className={`${styles.formatOption} ${format === 'csv' ? styles.formatActive : ''}`}>
            <input
              type="radio"
              name="format"
              value="csv"
              checked={format === 'csv'}
              onChange={() => setFormat('csv')}
            />
            <FileSpreadsheet size={20} />
            CSV (.csv)
          </label>
          <label className={`${styles.formatOption} ${format === 'json' ? styles.formatActive : ''}`}>
            <input
              type="radio"
              name="format"
              value="json"
              checked={format === 'json'}
              onChange={() => setFormat('json')}
            />
            <FileSpreadsheet size={20} />
            JSON
          </label>
        </div>
      </div>

      <button
        onClick={handleExport}
        disabled={exporting || selected.size === 0}
        className={styles.exportBtn}
      >
        <Download size={20} />
        {exporting ? 'Exporting...' : `Export ${selected.size} Transaction Types`}
      </button>

      {count !== null && (
        <div className={styles.countResult}>
          Exported {count} transactions. {format === 'json' && 'Data displayed in the response.'}
        </div>
      )}
    </div>
  );
}
