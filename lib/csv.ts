/* A CSV document from rows of plain values, for a download. Fields are
   quoted whenever they hold a comma, a quote or a line break (RFC 4180),
   and the file opens with a byte-order mark so Excel reads it as UTF-8
   instead of guessing. */

export type CsvValue = string | number | boolean | Date | null | undefined;

function cell(value: CsvValue): string {
  if (value === null || value === undefined) return "";
  let text = value instanceof Date ? value.toISOString() : String(value);
  // User-written text that starts like a formula would run in a
  // spreadsheet; a leading apostrophe keeps it as text.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function toCsv(headers: readonly string[], rows: readonly (readonly CsvValue[])[]): string {
  const lines = [headers, ...rows].map((row) => row.map(cell).join(","));
  return `﻿${lines.join("\r\n")}\r\n`;
}
