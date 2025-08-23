import {Badge, Container, Group, Stack, Text} from "@mantine/core"
import {IconClock, IconDatabase, IconUser} from "@tabler/icons-react"
import type {ColumnConfig, FilterValue, SortState} from "kommon"
import {useEffect, useState} from "react"
import {useGetPaginatedAuditLogsQuery} from "../apiSlice"

import {
  ColumnSelector,
  DataTable,
  TableFilters,
  TablePagination,
  useTableData
} from "kommon"

export default function AuditLogsList() {
  const lastPageSize = 5
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)

  const [sorting, setSorting] = useState<SortState>({
    column: null,
    direction: null
  })
  const [filters, setFilters] = useState<FilterValue[]>([])

  // Build API params
  const apiParams = buildApiParams(page, pageSize, sorting, filters)

  // RTK Query
  const {data, isLoading, isFetching, isError, error} =
    useGetPaginatedAuditLogsQuery(apiParams)

  // Table state management (without pagination - RTK handles that)
  const {state, actions, visibleColumns} = useTableData<AuditLogItem>({
    initialData: data || {
      items: [],
      page_number: 1,
      page_size: pageSize,
      num_pages: 0
    },
    initialColumns: auditLogColumns
    // Don't use onDataChange - RTK handles data fetching
  })
  // Update table data when RTK data changes
  useEffect(() => {
    if (data) {
      // Update only the data and columns, keep local sorting/filtering state
      actions.setColumns(state.columns) // Keep current column visibility
    }
  }, [data])

  // Handle sorting changes (triggers new API call)
  const handleSortChange = (newSorting: SortState) => {
    setSorting(newSorting)
    setPage(1) // Reset to first page when sorting changes
  }

  // Handle filter changes (triggers new API call)
  const handleFiltersChange = (newFilters: FilterValue[]) => {
    setFilters(newFilters)
    setPage(1) // Reset to first page when filters change
  }

  // Handle page size changes
  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize)
    setPage(1) // Reset to first page when page size changes
  }

  // Calculate total items for pagination display
  const totalItems = data ? data.num_pages * data.page_size : 0

  return (
    <Container size="xl" py="md">
      <Stack gap="lg">
        {/* Filters and Column Selector */}
        <Group justify="space-between" align="flex-start">
          <div style={{flex: 1}}>
            <TableFilters
              columns={state.columns}
              filters={filters}
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
          data={data?.items || []}
          columns={visibleColumns}
          sorting={sorting}
          onSortChange={handleSortChange}
          columnWidths={state.columnWidths}
          onColumnResize={actions.setColumnWidth}
          loading={isLoading || isFetching}
          emptyMessage="No audit logs found"
        />

        {/* Pagination */}
        <TablePagination
          currentPage={page}
          totalPages={data?.num_pages || 0}
          pageSize={pageSize}
          onPageChange={setPage}
          onPageSizeChange={handlePageSizeChange}
          totalItems={totalItems}
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
