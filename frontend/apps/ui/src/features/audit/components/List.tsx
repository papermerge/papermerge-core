import {useDynamicHeight} from "@/hooks/useDynamicHeight"
import {Container, Group, ScrollArea, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {useRef} from "react"
import type {AuditLogItem, SortBy} from "../types"
import auditLogColumns from "./auditLogColumns"
import Search from "./Search"
import useAuditLogTable from "./useAuditLogTable"

import {useAppDispatch} from "@/app/hooks"
import {auditLogPaginationUpdated} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {ColumnSelector, DataTable, TablePagination, useTableData} from "kommon"

export default function AuditLogsList() {
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const {setSorting, isError, data, queryParams, error, isLoading, isFetching} =
    useAuditLogTable()
  const actionButtonsRef = useRef<HTMLDivElement>(null)

  // Table state management
  const {state, actions, visibleColumns} = useTableData<AuditLogItem>({
    initialData: data || {
      items: [],
      page_number: 1,
      page_size: 15,
      num_pages: 0
    },
    initialColumns: auditLogColumns
  })

  const remainingHeight = useDynamicHeight([actionButtonsRef])

  // Handle sorting changes
  const handleSortChange = (newSorting: SortState) => {
    setSorting(newSorting.column as SortBy, newSorting.direction)
  }

  const handlePageSizeChange = (newValue: number) => {
    dispatch(
      auditLogPaginationUpdated({
        mode,
        value: {
          pageSize: newValue,
          pageNumber: 1
        }
      })
    )
  }

  const handlePageNumberChange = (pageNumber: number) => {
    dispatch(auditLogPaginationUpdated({mode, value: {pageNumber}}))
  }

  if (isError) {
    return (
      <Container size="xl" py="md">
        <div style={{textAlign: "center", padding: "2rem"}}>
          <h3>Error loading audit logs</h3>
          <p>{error?.toString() || "An error occurred"}</p>
        </div>
      </Container>
    )
  }

  return (
    <Stack gap="xs">
      <Group ref={actionButtonsRef} justify={"space-between"} align="center">
        <Search />
        <Group>
          <TablePagination
            currentPage={data?.page_number || 1}
            totalPages={data?.num_pages || 0}
            pageSize={data?.page_size || 15}
            onPageChange={handlePageNumberChange}
            onPageSizeChange={handlePageSizeChange}
            totalItems={data ? data.num_pages * data.page_size : 0}
          />
          <ColumnSelector
            columns={state.columns}
            onColumnsChange={actions.setColumns}
            onToggleColumn={actions.toggleColumnVisibility}
          />
        </Group>
      </Group>
      <ScrollArea mt={"md"} h={remainingHeight} type="auto">
        <DataTable
          data={data?.items || []}
          columns={visibleColumns}
          sorting={{
            column: queryParams.sort_by || null,
            direction: queryParams.sort_direction || null
          }}
          onSortChange={handleSortChange}
          columnWidths={state.columnWidths}
          onColumnResize={actions.setColumnWidth}
          loading={isLoading || isFetching}
          emptyMessage="No audit logs found"
        />
      </ScrollArea>
    </Stack>
  )
}
