import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import toast from 'react-hot-toast';
import { parseFile, importTransactions } from '../api/client';
import type { ParsedTransaction } from '../types';
import { Upload, FileText, AlertCircle, CheckCircle, X } from 'lucide-react';
import styles from './Import.module.css';

export default function Import() {
  const [file, setFile] = useState<File | null>(null);
  const [parsed, setParsed] = useState<ParsedTransaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; failed: number } | null>(null);

  const onDrop = useCallback(async (accepted: File[]) => {
    const f = accepted[0];
    if (!f) return;
    setFile(f);
    setParsed([]);
    setResult(null);
    setLoading(true);
    try {
      const data = await parseFile(f);
      setParsed(data.transactions);
      toast.success(`Parsed ${data.count} transactions from ${f.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to parse file');
    } finally {
      setLoading(false);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'text/plain': ['.txt'],
    },
    maxFiles: 1,
  });

  const handleImport = async () => {
    if (parsed.length === 0) return;
    setImporting(true);
    try {
      const res = await importTransactions(parsed);
      setResult({ imported: res.importedCount, failed: res.failedCount });
      if (res.success) {
        toast.success(`Successfully imported ${res.importedCount} transactions!`);
      } else {
        toast.error(`Imported ${res.importedCount}, but ${res.failedCount} failed`);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const reset = () => {
    setFile(null);
    setParsed([]);
    setResult(null);
  };

  const columns = parsed.length > 0 ? Object.keys(parsed[0].fields) : [];
  const typeCounts = parsed.reduce<Record<string, number>>((acc, tx) => {
    acc[tx.type] = (acc[tx.type] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className={styles.page}>
      <h2>Import Transactions</h2>
      <p className={styles.subtitle}>Upload Excel, CSV, PDF, or image files to import into QuickBooks</p>

      {!file && (
        <div {...getRootProps()} className={`${styles.dropzone} ${isDragActive ? styles.active : ''}`}>
          <input {...getInputProps()} />
          <Upload size={40} />
          {isDragActive ? (
            <p>Drop your file here...</p>
          ) : (
            <>
              <p className={styles.dropText}>Drag & drop a file here, or click to browse</p>
              <p className={styles.dropHint}>Supports CSV, Excel (.xlsx, .xls), PDF, JPG, PNG</p>
            </>
          )}
        </div>
      )}

      {loading && (
        <div className={styles.status}>
          <FileText size={20} />
          Parsing file...
        </div>
      )}

      {parsed.length > 0 && (
        <div className={styles.preview}>
          <div className={styles.previewHeader}>
            <div className={styles.previewInfo}>
              <FileText size={20} />
              <span>{file?.name} — {parsed.length} transactions found</span>
              <div className={styles.typeBadges}>
                {Object.entries(typeCounts).map(([type, count]) => (
                  <span key={type} className={styles.badge}>
                    {type}: {count}
                  </span>
                ))}
              </div>
            </div>
            <div className={styles.previewActions}>
              <button onClick={reset} className={styles.clearBtn}>
                <X size={16} />
                Clear
              </button>
              <button
                onClick={handleImport}
                disabled={importing}
                className={styles.importBtn}
              >
                {importing ? 'Importing...' : `Import ${parsed.length} Transactions`}
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Type</th>
                  {columns.slice(0, 6).map((col) => (
                    <th key={col}>{col}</th>
                  ))}
                  {columns.length > 6 && <th>+{columns.length - 6} more</th>}
                </tr>
              </thead>
              <tbody>
                {parsed.slice(0, 50).map((tx) => (
                  <tr key={tx.rowNumber}>
                    <td className={styles.rowNum}>{tx.rowNumber}</td>
                    <td><span className={styles.typeTag}>{tx.type}</span></td>
                    {columns.slice(0, 6).map((col) => (
                      <td key={col}>{tx.fields[col]}</td>
                    ))}
                    {columns.length > 6 && <td>...</td>}
                  </tr>
                ))}
              </tbody>
            </table>
            {parsed.length > 50 && (
              <div className={styles.more}>Showing 50 of {parsed.length} rows</div>
            )}
          </div>
        </div>
      )}

      {result && (
        <div className={`${styles.result} ${result.failed === 0 ? styles.success : styles.partial}`}>
          {result.failed === 0 ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>
            {result.imported > 0 && `${result.imported} imported successfully. `}
            {result.failed > 0 && `${result.failed} failed. `}
            <button onClick={reset} className={styles.resetBtn}>Import another file</button>
          </span>
        </div>
      )}
    </div>
  );
}
