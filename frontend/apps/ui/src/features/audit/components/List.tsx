import {useAppDispatch} from "@/app/hooks"
import {auditLogVisibleFilterUpdated} from "@/features/ui/uiSlice"
import {useDynamicHeight} from "@/hooks/useDynamicHeight"
import {Container, Group, ScrollArea, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {useCallback, useRef} from "react"
import type {AuditLogItem, FilterListConfig, SortBy} from "../types"
import auditLogColumns from "./auditLogColumns"
import Search from "./Search"
import useAuditLogTable from "./useAuditLogTable"

import {usePanelMode} from "@/hooks"
import {ColumnSelector, DataTable, TablePagination, useTableData} from "kommon"

export default function AuditLogsList() {
  const auditLogTable = useAuditLogTable()
  const dispatch = useAppDispatch()

  const mode = usePanelMode()
  const actionButtonsRef = useRef<HTMLDivElement>(null)
  const filtersRef = useRef<HTMLDivElement>(null)
  const paginationRef = useRef<HTMLDivElement>(null) // Pagination

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

  const remainingHeight = useDynamicHeight([
    actionButtonsRef,
    filtersRef,
    paginationRef
  ])

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

  const onFilterVisibilityChange = useCallback(
    (items: FilterListConfig[]) => {
      const visibleFilterKeys = items.filter(i => i.visible).map(i => i.key)

      dispatch(
        auditLogVisibleFilterUpdated({filterKeys: visibleFilterKeys, mode})
      )
    },
    [dispatch, mode]
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
    <Stack gap="xs">
      <Group ref={actionButtonsRef} justify={"space-between"} align="center">
        <Search />
        <ColumnSelector
          columns={state.columns}
          onColumnsChange={actions.setColumns}
          onToggleColumn={actions.toggleColumnVisibility}
        />
      </Group>
      <ScrollArea mt={"md"} h={remainingHeight} type="auto">
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
      </ScrollArea>

      <TablePagination
        ref={paginationRef}
        currentPage={auditLogTable.data?.page_number || 1}
        totalPages={auditLogTable.data?.num_pages || 0}
        pageSize={auditLogTable.data?.page_size || 15}
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
