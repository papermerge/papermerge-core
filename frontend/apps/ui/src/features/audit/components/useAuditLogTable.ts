import type {PaginatedArgs} from "@/types"
import type {FilterValue} from "kommon"
import {useCallback, useMemo, useState} from "react"
import {useGetPaginatedAuditLogsQuery} from "../apiSlice"

type SortBy =
  | "timestamp"
  | "operation"
  | "table_name"
  | "username"
  | "record_id"
  | "user_id"
  | "id"

export interface AuditLogQueryParams extends Partial<PaginatedArgs> {
  // Pagination (inherited from PaginatedArgs)
  page_number?: number
  page_size?: number

  // Sorting
  sort_by?: SortBy
  sort_direction?: "asc" | "desc"

  // Filters
  filter_operation?: "INSERT" | "UPDATE" | "DELETE"
  filter_table_name?: string
  filter_username?: string
  filter_user_id?: string
  filter_record_id?: string
  filter_timestamp_from?: string // ISO string format
  filter_timestamp_to?: string // ISO string format
}

// Enhanced helper hook with filter support
export default function useAuditLogTable() {
  const [queryParams, setQueryParams] = useState<AuditLogQueryParams>({
    page_number: 1,
    page_size: 5
  })

  // RTK Query
  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedAuditLogsQuery(queryParams)

  // Convert API params to table filters format
  const currentFilters = useMemo((): FilterValue[] => {
    const filters: FilterValue[] = []
    if (queryParams.filter_operation) {
      filters.push({
        column: "operation",
        value: queryParams.filter_operation,
        operator: "equals"
      })
    }

    if (queryParams.filter_table_name) {
      filters.push({
        column: "table_name",
        value: queryParams.filter_table_name,
        operator: "contains"
      })
    }

    if (queryParams.filter_username) {
      filters.push({
        column: "username",
        value: queryParams.filter_username,
        operator: "contains"
      })
    }

    if (queryParams.filter_user_id) {
      filters.push({
        column: "user_id",
        value: queryParams.filter_user_id,
        operator: "equals"
      })
    }

    if (queryParams.filter_record_id) {
      filters.push({
        column: "record_id",
        value: queryParams.filter_record_id,
        operator: "contains"
      })
    }

    // Handle timestamp filters
    if (queryParams.filter_timestamp_from && queryParams.filter_timestamp_to) {
      filters.push({
        column: "timestamp",
        value: `${queryParams.filter_timestamp_from} - ${queryParams.filter_timestamp_to}`,
        operator: "range"
      })
    } else if (queryParams.filter_timestamp_from) {
      filters.push({
        column: "timestamp",
        value: queryParams.filter_timestamp_from,
        operator: "from"
      })
    } else if (queryParams.filter_timestamp_to) {
      filters.push({
        column: "timestamp",
        value: queryParams.filter_timestamp_to,
        operator: "to"
      })
    }

    return filters
  }, [queryParams])

  // Helper functions
  const setPage = useCallback((page_number: number) => {
    setQueryParams(prev => ({...prev, page_number}))
  }, [])

  const setPageSize = useCallback((page_size: number) => {
    setQueryParams(prev => ({...prev, page_size, page_number: 1})) // Reset to first page
  }, [])

  const setSorting = useCallback(
    (sort_by: SortBy | null, sort_direction: "asc" | "desc" | null) => {
      setQueryParams(prev => ({
        ...prev,
        sort_by: sort_by || undefined,
        sort_direction: sort_direction || undefined,
        page_number: 1 // Reset to first page when sorting changes
      }))
    },
    []
  )

  const setFilters = useCallback((filters: Partial<AuditLogQueryParams>) => {
    setQueryParams(prev => ({
      ...prev,
      ...filters,
      page_number: 1 // Reset to first page when filters change
    }))
  }, [])

  // Convert table filters to API format
  const setTableFilters = useCallback(
    (newFilters: FilterValue[]) => {
      const apiFilters: Partial<AuditLogQueryParams> = {
        // Clear existing filters
        filter_operation: undefined,
        filter_table_name: undefined,
        filter_username: undefined,
        filter_user_id: undefined,
        filter_record_id: undefined,
        filter_timestamp_from: undefined,
        filter_timestamp_to: undefined
      }

      newFilters.forEach(filter => {
        const value = Array.isArray(filter.value)
          ? filter.value[0]
          : filter.value

        switch (filter.column) {
          case "operation":
            apiFilters.filter_operation = value as
              | "INSERT"
              | "UPDATE"
              | "DELETE"
            break
          case "table_name":
            apiFilters.filter_table_name = value
            break
          case "username":
            apiFilters.filter_username = value
            break
          case "user_id":
            apiFilters.filter_user_id = value
            break
          case "record_id":
            apiFilters.filter_record_id = value
            break
          case "timestamp":
            if (filter.operator === "range" && typeof value === "string") {
              const [from, to] = value.split(" - ")
              if (from) apiFilters.filter_timestamp_from = from.trim()
              if (to) apiFilters.filter_timestamp_to = to.trim()
            } else if (filter.operator === "from") {
              apiFilters.filter_timestamp_from = value
            } else if (filter.operator === "to") {
              apiFilters.filter_timestamp_to = value
            }
            break
        }
      })
      setFilters(apiFilters)
    },
    [setFilters]
  )

  const clearFilters = useCallback(() => {
    setQueryParams(prev => ({
      page_number: 1,
      page_size: prev.page_size,
      sort_by: prev.sort_by,
      sort_direction: prev.sort_direction
    }))
  }, [])

  return {
    // Data
    data,
    isLoading,
    isFetching,
    isError,
    error,

    // Current state
    queryParams,
    currentFilters, // ← NEW: Filters in table format

    // Actions
    setPage,
    setPageSize,
    setSorting,
    setFilters, // API format
    setTableFilters, // Table format (NEW)
    clearFilters,
    setQueryParams // Direct access for advanced use
  }
}
