/**
 * Lightweight, dependency-free CSV export utilities.
 * Properly escapes values containing commas, quotes, or newlines (RFC 4180).
 */

function escapeCell(value: unknown): string {
  if (value === null || value === undefined) return ""
  const str = String(value)
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`
  }
  return str
}

export function toCsv(headers: string[], rows: (unknown[])[]): string {
  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => row.map(escapeCell).join(",")),
  ]
  // Prefix with BOM so Excel renders Arabic/UTF-8 correctly.
  return "\uFEFF" + lines.join("\r\n")
}

export function downloadCsv(filename: string, headers: string[], rows: (unknown[])[]): void {
  const csv = toCsv(headers, rows)
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename.endsWith(".csv") ? filename : `${filename}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
