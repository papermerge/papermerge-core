import type {PaginatedArgs} from "@/types"

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

export type SortBy =
  | "timestamp"
  | "operation"
  | "table_name"
  | "username"
  | "record_id"
  | "user_id"
  | "id"

export interface FilterListConfig {
  key: string
  label: string
  visible?: boolean
}

export interface AuditLogQueryParams extends Partial<PaginatedArgs> {
  // Pagination (inherited from PaginatedArgs)
  page_number?: number
  page_size?: number

  // Sorting
  sort_by?: SortBy
  sort_direction?: "asc" | "desc"

  // Filters
  filter_operation?: string
  filter_table_name?: string
  filter_username?: string
  filter_user_id?: string
  filter_record_id?: string
  filter_timestamp_from?: string // ISO string format
  filter_timestamp_to?: string // ISO string format
}
