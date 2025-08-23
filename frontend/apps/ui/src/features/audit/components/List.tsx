import {Container, Group, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {useCallback, useState} from "react"
import type {AuditLogItem, DropdownConfig, SortBy} from "../types"
import auditLogColumns from "./auditLogColumns"
import FilterSelector from "./DropdownSelector"
import useAuditLogTable from "./useAuditLogTable"

import {ColumnSelector, DataTable, TablePagination, useTableData} from "kommon"
import Filters from "./FiltersCollapse"

let initialFilters = [
  {key: "timestamp", label: "Timestamp", visible: false},
  {key: "operation", label: "Operation", visible: false},
  {key: "table_name", label: "Table", visible: false},
  {key: "user", label: "User", visible: false}
]

export default function AuditLogsList() {
  const auditLogTable = useAuditLogTable()
  const [filtersList, setFiltersList] = useState<DropdownConfig[]>([])

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

  // Handle sorting changes
  const handleSortChange = useCallback(
    (newSorting: SortState) => {
      auditLogTable.setSorting(
        newSorting.column as SortBy,
        newSorting.direction
      )
    },
    [auditLogTable]
  )

  const onFilterVisibilityChange = (items: DropdownConfig[]) => {
    const visibleItems = items.filter(i => i.visible)
    setFiltersList(visibleItems)
  }

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
    <Stack gap="xs">
      <Filters filters={filtersList} />
      <Group justify="end" align="flex-start">
        <FilterSelector
          onChange={onFilterVisibilityChange}
          initialItems={initialFilters}
        />

        <ColumnSelector
          columns={state.columns}
          onColumnsChange={actions.setColumns}
          onToggleColumn={actions.toggleColumnVisibility}
        />
      </Group>

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
  )
}
