import ExcelJS from 'exceljs';

export interface OtExportRow {
  workDate: string; // YYYY-MM-DD
  email: string;
  name: string;
  durationHours: number;
  projectName: string;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2025-11" -> "Nov 2025" (falls back to the raw string). */
export function monthLabel(month: string): string {
  const m = /^(\d{4})-(\d{2})$/.exec(month);
  if (!m) return month || 'OT';
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[1]}`;
}

/** "YYYY-MM-DD" -> "DD/MM/YYYY" (pure string reformat, no timezone math). */
function ddmmyyyy(workDate: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(workDate);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : workDate;
}

/**
 * Build a one-month OT workbook in the "Resource management" layout:
 * row 1 = month total in the Hour column (D), row 2 = headers
 * (Date | ID | Name | Hour | Project), rows 3+ = one OT entry each.
 */
export async function buildOtWorkbook(rows: OtExportRow[], month: string): Promise<Buffer> {
  const wb = new ExcelJS.Workbook();
  const ws = wb.addWorksheet(monthLabel(month));
  ws.columns = [
    { width: 12 },
    { width: 24 },
    { width: 16 },
    { width: 9 },
    { width: 18 },
  ];

  ws.addRow([]); // row 1 — total row (only the Hour cell is filled)
  ws.addRow(['Date', 'ID', 'Name', 'Hour', 'Project']); // row 2 — headers
  for (const r of rows) {
    ws.addRow([ddmmyyyy(r.workDate), r.email, r.name, r.durationHours, r.projectName]);
  }

  const bold9 = { bold: true, size: 9 } as const;
  const total = ws.getCell('D1');
  total.value = rows.length ? { formula: `SUBTOTAL(9,D3:D${2 + rows.length})` } : 0;
  total.font = bold9;
  ws.getRow(2).font = bold9;
  ws.getRow(2).eachCell((c) => {
    c.font = bold9;
  });
  // Match the reference's compact 9pt body text.
  for (let r = 3; r <= 2 + rows.length; r++) {
    ws.getRow(r).font = { size: 9 };
  }

  const data = await wb.xlsx.writeBuffer();
  return Buffer.isBuffer(data) ? data : Buffer.from(data as ArrayBuffer);
}
