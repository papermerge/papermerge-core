import {PAGINATION_DEFAULT_ITEMS_PER_PAGES} from "@/cconstants"
import {apiSlice} from "@/features/api/slice"
import type {Paginated, PaginatedArgs} from "@/types"
import type {AuditLog} from "./types"

// Extended query parameters for audit logs
export interface AuditLogQueryParams extends Partial<PaginatedArgs> {
  // Pagination (inherited from PaginatedArgs)
  page_number?: number
  page_size?: number

  // Sorting
  sort_by?:
    | "timestamp"
    | "operation"
    | "table_name"
    | "username"
    | "record_id"
    | "user_id"
    | "id"
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

// Helper function to build clean query string
function buildQueryString(params: AuditLogQueryParams = {}): string {
  const searchParams = new URLSearchParams()

  // Always include pagination with defaults
  searchParams.append("page_number", String(params.page_number || 1))
  searchParams.append(
    "page_size",
    String(params.page_size || PAGINATION_DEFAULT_ITEMS_PER_PAGES)
  )

  // Add sorting if provided
  if (params.sort_by) {
    searchParams.append("sort_by", params.sort_by)
  }
  if (params.sort_direction) {
    searchParams.append("sort_direction", params.sort_direction)
  }

  // Add filters if provided
  if (params.filter_operation) {
    searchParams.append("filter_operation", params.filter_operation)
  }
  if (params.filter_table_name) {
    searchParams.append("filter_table_name", params.filter_table_name)
  }
  if (params.filter_username) {
    searchParams.append("filter_username", params.filter_username)
  }
  if (params.filter_user_id) {
    searchParams.append("filter_user_id", params.filter_user_id)
  }
  if (params.filter_record_id) {
    searchParams.append("filter_record_id", params.filter_record_id)
  }
  if (params.filter_timestamp_from) {
    searchParams.append("filter_timestamp_from", params.filter_timestamp_from)
  }
  if (params.filter_timestamp_to) {
    searchParams.append("filter_timestamp_to", params.filter_timestamp_to)
  }

  return searchParams.toString()
}

export const apiSliceWithAuditLogs = apiSlice.injectEndpoints({
  endpoints: builder => ({
    getPaginatedAuditLogs: builder.query<
      Paginated<AuditLog>,
      AuditLogQueryParams | void
    >({
      query: (params = {}) => {
        const queryString = buildQueryString(params || {})
        return `/audit-logs/?${queryString}`
      },
      providesTags: (
        result = {page_number: 1, page_size: 1, num_pages: 1, items: []},
        _error,
        _arg
      ) => [
        "AuditLog",
        ...result.items.map(({id}) => ({type: "AuditLog", id}) as const)
      ]
    }),
    getAuditLog: builder.query<AuditLog, string>({
      query: auditLogID => `/audit-logs/${auditLogID}`,
      providesTags: (_result, _error, arg) => [{type: "AuditLog", id: arg}]
    })
  })
})

export const {useGetPaginatedAuditLogsQuery, useGetAuditLogQuery} =
  apiSliceWithAuditLogs
