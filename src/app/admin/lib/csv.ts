// Builds a UTF-8 CSV (with BOM so Excel reads Thai correctly) and triggers a download.
export function downloadCSV(filename: string, headers: string[], rows: (string | number)[][]) {
  const bom = '﻿';
  const esc = (c: string | number) => `"${String(c).replace(/"/g, '""')}"`;
  const csv = bom + [headers, ...rows].map((r) => r.map(esc).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
