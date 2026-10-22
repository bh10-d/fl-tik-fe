/**
 * Formats a number with compact notation (e.g., 12.4K, 1.2M)
 */
export function formatCompactNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A"
  }
  if (value >= 1_000_000) {
    const formatted = (value / 1_000_000).toFixed(1)
    return `${formatted.replace(/\.0$/, "")}M`
  }
  if (value >= 1_000) {
    const formatted = (value / 1_000).toFixed(1)
    return `${formatted.replace(/\.0$/, "")}K`
  }
  return value.toLocaleString("en-US")
}

/**
 * Formats a date string in "Oct 18, 2026" format
 */
export function formatDate(
  isoString: string | null | undefined,
  timeZone: string = "Asia/Ho_Chi_Minh"
): string {
  if (!isoString) return "N/A"
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timeZone || "Asia/Ho_Chi_Minh",
    }).format(date)
  } catch {
    return "N/A"
  }
}

/**
 * Formats a time string in "1:30 PM" format
 */
export function formatTime(
  isoString: string | null | undefined,
  timeZone: string = "Asia/Ho_Chi_Minh"
): string {
  if (!isoString) return "N/A"
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZone || "Asia/Ho_Chi_Minh",
    }).format(date)
  } catch {
    return "N/A"
  }
}

/**
 * Formats date and time: "Oct 18, 2026, 1:30 PM"
 */
export function formatDateTime(
  isoString: string | null | undefined,
  timeZone: string = "Asia/Ho_Chi_Minh"
): string {
  if (!isoString) return "N/A"
  try {
    const date = new Date(isoString)
    if (isNaN(date.getTime())) return "N/A"
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timeZone || "Asia/Ho_Chi_Minh",
    }).format(date)
  } catch {
    return "N/A"
  }
}

/**
 * Formats percentage value
 */
export function formatPercentage(value: number | null | undefined): string {
  if (value === null || value === undefined || isNaN(value)) {
    return "N/A"
  }
  return `${value.toFixed(1)}%`
}

/**
 * Relative time ago (e.g. 2 hours ago, 3 days ago)
 */
export function formatTimeAgo(
  isoString: string | null | undefined,
  timeZone: string = "Asia/Ho_Chi_Minh"
): string {
  if (!isoString) return "N/A"
  try {
    const date = new Date(isoString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return "Just now"
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`
    return formatDate(isoString, timeZone)
  } catch {
    return "N/A"
  }
}

/**
 * Converts array of objects to CSV string and initiates browser download
 */
export function exportToCSV<T extends Record<string, unknown>>(
  filename: string,
  rows: T[],
  headers: { key: keyof T; label: string }[]
) {
  if (!rows || rows.length === 0) return

  const headerLine = headers.map((h) => `"${h.label}"`).join(",")
  const rowLines = rows.map((row) =>
    headers
      .map((h) => {
        const val = row[h.key]
        if (val === null || val === undefined) return '""'
        const str = String(val).replace(/"/g, '""')
        return `"${str}"`
      })
      .join(",")
  )

  const csvContent = [headerLine, ...rowLines].join("\n")
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.setAttribute("href", url)
  link.setAttribute("download", filename)
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Parse CSV text into array of record objects
 */
export function parseCSV(csvText: string): Record<string, string>[] {
  const lines = csvText.trim().split(/\r\n|\n/)
  if (lines.length < 2) return []

  const parseLine = (line: string): string[] => {
    const values: string[] = []
    let current = ""
    let inQuotes = false

    for (let i = 0; i < line.length; i++) {
      const char = line[i]
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"'
          i++
        } else {
          inQuotes = !inQuotes
        }
      } else if (char === "," && !inQuotes) {
        values.push(current.trim())
        current = ""
      } else {
        current += char
      }
    }
    values.push(current.trim())
    return values
  }

  const headers = parseLine(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, ""))
  const result: Record<string, string>[] = []

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue
    const values = parseLine(lines[i])
    const row: Record<string, string> = {}
    headers.forEach((header, idx) => {
      row[header] = values[idx] || ""
    })
    result.push(row)
  }

  return result
}

