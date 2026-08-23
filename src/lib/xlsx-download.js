'use client';

// ============================================
// Browser-side .xlsx writer.
//
// `xlsx` is ~400 KB, and almost nobody on any given page visit clicks export —
// so it is imported dynamically here and never lands in the main bundle.
// ============================================

/**
 * Write rows to a real .xlsx file and hand it to the browser as a download.
 *
 * @param {Array<Object>} rows      objects keyed by header text (json_to_sheet shape)
 * @param {string}        fileName  including the .xlsx extension
 * @param {{ sheetName?: string, widths?: number[], rtl?: boolean }} opts
 */
export async function downloadXlsx(rows, fileName, { sheetName = 'Sheet1', widths, rtl = false } = {}) {
  const XLSX = await import('xlsx');

  const sheet = XLSX.utils.json_to_sheet(rows);
  if (widths?.length) {
    sheet['!cols'] = widths.map((wch) => ({ wch }));
  }
  if (rtl) {
    // Opens right-to-left in Excel, matching how the gym reads its own sheets.
    sheet['!views'] = [{ RTL: true }];
  }

  const book = XLSX.utils.book_new();
  // Excel refuses sheet names longer than 31 chars or containing []:*?/\
  XLSX.utils.book_append_sheet(book, sheet, sheetName.replace(/[[\]:*?/\\]/g, '').slice(0, 31));
  XLSX.writeFile(book, fileName);
}
