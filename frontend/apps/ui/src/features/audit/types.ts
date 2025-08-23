export type AuditOperation = "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE"

export type AuditLog = {
  id: string
  table_name: string
  record_id: string
  operation: AuditOperation
  timestamp: string
  user_id: string
  username: string
}

export interface AuditLogItem {
  id: string
  table_name: string
  record_id: string
  operation: "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE"
  timestamp: string
  user_id: string
  username: string
}
