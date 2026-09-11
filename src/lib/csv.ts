// Quote every field and neutralise spreadsheet formulas in exported text.
export function csvCell(value: string): string {
 const safe = /^[\s]*[=+@-]/.test(value) ? "'" + value : value;
 return '"' + safe.replace(/"/g, '""') + '"';
}
export function csvRows(rows: string[][]): string {return rows.map(row=>row.map(csvCell).join(',')).join('\r\n');}
