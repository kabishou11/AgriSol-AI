/**
 * 格式化SQLite日期字符串为ISO格式
 * SQLite: "2026-03-12 15:04:29" -> ISO: "2026-03-12T15:04:29"
 */
export function formatDateToISO(dateStr) {
  if (!dateStr) return null
  if (typeof dateStr !== 'string') return dateStr
  // 如果已经是ISO格式（包含T），直接返回
  if (dateStr.includes('T')) return dateStr
  // 将空格替换为T
  return dateStr.replace(' ', 'T')
}

/**
 * 格式化单个记录的所有日期字段
 */
export function formatRecordDates(record, dateFields = []) {
  if (!record) return record

  const formatted = { ...record }

  // 如果没有指定字段，自动检测常见的日期字段
  const autoDetectFields = dateFields.length === 0
  const commonDateFields = [
    'created_at', 'updated_at', 'timestamp', 'uploaded_at',
    'monitoring_date', 'joined_at', 'last_active', 'date'
  ]

  const fieldsToFormat = autoDetectFields
    ? commonDateFields.filter(f => f in record)
    : dateFields

  for (const field of fieldsToFormat) {
    if (formatted[field]) {
      formatted[field] = formatDateToISO(formatted[field])
    }
  }

  return formatted
}

/**
 * 格式化记录数组的所有日期字段
 */
export function formatRecordsDates(records, dateFields = []) {
  if (!Array.isArray(records)) return records
  return records.map(record => formatRecordDates(record, dateFields))
}
