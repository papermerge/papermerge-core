import type {PaginatedArgs} from "@/types"
import {Badge, Container, Group, Stack, Text} from "@mantine/core"
import {IconClock, IconDatabase, IconUser} from "@tabler/icons-react"
import type {ColumnConfig, FilterValue, SortState} from "kommon"
import {useCallback, useState} from "react"
import {useGetPaginatedAuditLogsQuery} from "../apiSlice"

import {
  ColumnSelector,
  DataTable,
  TableFilters,
  TablePagination,
  useTableData
} from "kommon"

export default function AuditLogsList() {
  // Use the helper hook from the API slice
  const auditLogTable = useAuditLogTable()

  // Table state management
  const {state, actions, visibleColumns} = useTableData<AuditLogItem>({
    initialData: auditLogTable.data || {
      items: [],
      page_number: 1,
      page_size: 15,
      num_pages: 0
    },
    initialColumns: auditLogColumns
  })

  // Convert table filters to API format
  const handleFiltersChange = useCallback(
    (newFilters: FilterValue[]) => {
      const apiFilters: Partial<AuditLogQueryParams> = {}

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
        }
      })

      auditLogTable.setFilters(apiFilters)
    },
    [auditLogTable]
  )

  // Handle sorting changes
  const handleSortChange = useCallback(
    (newSorting: SortState) => {
      auditLogTable.setSorting(newSorting.column as any, newSorting.direction)
    },
    [auditLogTable]
  )

  if (auditLogTable.isError) {
    return (
      <Container size="xl" py="md">
        <div style={{textAlign: "center", padding: "2rem"}}>
          <h3>Error loading audit logs</h3>
          <p>{auditLogTable.error?.toString() || "An error occurred"}</p>
        </div>
      </Container>
    )
  }

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Filters and Column Selector */}
        <Group justify="space-between" align="flex-start">
          <div style={{flex: 1}}>
            <TableFilters
              columns={state.columns}
              filters={[]} // Convert from API params if needed
              onFiltersChange={handleFiltersChange}
            />
          </div>

          <ColumnSelector
            columns={state.columns}
            onColumnsChange={actions.setColumns}
            onToggleColumn={actions.toggleColumnVisibility}
          />
        </Group>

        {/* Data Table */}
        <DataTable
          data={auditLogTable.data?.items || []}
          columns={visibleColumns}
          sorting={{
            column: auditLogTable.queryParams.sort_by || null,
            direction: auditLogTable.queryParams.sort_direction || null
          }}
          onSortChange={handleSortChange}
          columnWidths={state.columnWidths}
          onColumnResize={actions.setColumnWidth}
          loading={auditLogTable.isLoading || auditLogTable.isFetching}
          emptyMessage="No audit logs found"
        />

        {/* Pagination */}
        <TablePagination
          currentPage={auditLogTable.queryParams.page_number || 1}
          totalPages={auditLogTable.data?.num_pages || 0}
          pageSize={auditLogTable.queryParams.page_size || 15}
          onPageChange={auditLogTable.setPage}
          onPageSizeChange={auditLogTable.setPageSize}
          totalItems={
            auditLogTable.data
              ? auditLogTable.data.num_pages * auditLogTable.data.page_size
              : 0
          }
          showPageSizeSelector
        />
      </Stack>
    </Container>
  )
}

interface AuditLogItem {
  id: string
  table_name: string
  record_id: string
  operation: "INSERT" | "UPDATE" | "DELETE" | "TRUNCATE"
  timestamp: string
  user_id: string
  username: string
}

const auditLogColumns: ColumnConfig<AuditLogItem>[] = [
  {
    key: "timestamp",
    label: "Timestamp",
    sortable: true,
    filterable: false,
    width: 180,
    render: value => {
      const date = new Date(value as string)
      return (
        <Group gap="xs">
          <IconClock size={14} style={{opacity: 0.6}} />
          <div>
            <Text size="xs">{date.toLocaleDateString()}</Text>
            <Text size="xs" c="dimmed">
              {date.toLocaleTimeString()}
            </Text>
          </div>
        </Group>
      )
    }
  },
  {
    key: "operation",
    label: "Operation",
    sortable: true,
    filterable: true,
    width: 100,
    render: value => {
      const colors: Record<string, string> = {
        INSERT: "green",
        UPDATE: "blue",
        DELETE: "red"
      }
      return (
        <Badge
          color={colors[value as string] || "gray"}
          variant="light"
          size="sm"
        >
          {value as string}
        </Badge>
      )
    }
  },
  {
    key: "table_name",
    label: "Table",
    sortable: true,
    filterable: true,
    width: 150,
    render: value => (
      <Group gap="xs">
        <IconDatabase size={14} style={{opacity: 0.6}} />
        <Text size="sm" ff="monospace">
          {value as string}
        </Text>
      </Group>
    )
  },
  {
    key: "record_id",
    label: "Record ID",
    sortable: false,
    filterable: true,
    width: 200,
    render: value => (
      <Text size="xs" ff="monospace" title={value as string}>
        {(value as string).substring(0, 8)}...
      </Text>
    )
  },
  {
    key: "username",
    label: "User",
    sortable: true,
    filterable: true,
    width: 120,
    render: value => (
      <Group gap="xs">
        <IconUser size={14} style={{opacity: 0.6}} />
        <Text size="sm">{value as string}</Text>
      </Group>
    )
  },
  {
    key: "user_id",
    label: "User ID",
    sortable: false,
    filterable: true,
    visible: false, // Hidden by default
    width: 200,
    render: value => (
      <Text size="xs" ff="monospace" title={value as string}>
        {(value as string).substring(0, 8)}...
      </Text>
    )
  },
  {
    key: "id",
    label: "Log ID",
    sortable: false,
    filterable: false,
    visible: false, // Hidden by default
    width: 200,
    render: value => (
      <Text size="xs" ff="monospace" title={value as string}>
        {(value as string).substring(0, 8)}...
      </Text>
    )
  }
]
interface GetPaginatedAuditLogsParams {
  page_number: number
  page_size: number
  sort_by?: string
  sort_direction?: "asc" | "desc"
  filters?: Record<string, any>
}

function buildApiParams(
  page: number,
  pageSize: number,
  sorting: SortState,
  filters: FilterValue[]
): GetPaginatedAuditLogsParams {
  const params: GetPaginatedAuditLogsParams = {
    page_number: page,
    page_size: pageSize
  }

  // Add sorting
  if (sorting.column && sorting.direction) {
    params.sort_by = sorting.column
    params.sort_direction = sorting.direction
  }

  // Add filters
  if (filters.length > 0) {
    params.filters = filters.reduce(
      (acc, filter) => {
        acc[filter.column] = {
          value: filter.value,
          operator: filter.operator || "contains"
        }
        return acc
      },
      {} as Record<string, any>
    )
  }

  return params
}

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
  filter_operation?: "INSERT" | "UPDATE" | "DELETE"
  filter_table_name?: string
  filter_username?: string
  filter_user_id?: string
  filter_record_id?: string
  filter_timestamp_from?: string // ISO string format
  filter_timestamp_to?: string // ISO string format
}

// Helper function to build clean query string
function buildQueryString(params: AuditLogQueryParams): string {
  const searchParams = new URLSearchParams()

  // Always include pagination with defaults
  searchParams.append("page_number", String(params.page_number || 1))
  searchParams.append("page_size", String(params.page_size || 5))

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

// Helper hook for table integration (optional but recommended)
export function useAuditLogTable() {
  const [queryParams, setQueryParams] = useState<AuditLogQueryParams>({
    page_number: 1,
    page_size: 5
  })

  // RTK Query
  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedAuditLogsQuery(queryParams)

  // Helper functions
  const setPage = useCallback((page_number: number) => {
    setQueryParams(prev => ({...prev, page_number}))
  }, [])

  const setPageSize = useCallback((page_size: number) => {
    setQueryParams(prev => ({...prev, page_size, page_number: 1})) // Reset to first page
  }, [])

  const setSorting = useCallback(
    (sort_by: string | null, sort_direction: "asc" | "desc" | null) => {
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

    // Actions
    setPage,
    setPageSize,
    setSorting,
    setFilters,
    clearFilters,
    setQueryParams // Direct access for advanced use
  }
}
