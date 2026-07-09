import { downloadBlob } from './download';

/** Build a CSV string (RFC-4180-ish) from a header row + data rows. */
export function toCsv(headers: string[], rows: (string | number)[][]): string {
  const esc = (v: string | number) => {
    const s = String(v);
    return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [headers, ...rows].map((row) => row.map(esc).join(',')).join('\r\n');
}

/**
 * Trigger a browser download of a CSV file. Prepends a UTF-8 BOM so Excel opens
 * non-ASCII text (e.g. Vietnamese names) with the correct encoding.
 */
export function downloadCsv(filename: string, csv: string): void {
  const BOM = String.fromCharCode(0xfeff);
  downloadBlob(filename, new Blob([BOM + csv], { type: 'text/csv;charset=utf-8;' }));
}
