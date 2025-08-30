import {useDynamicHeight} from "@/hooks/useDynamicHeight"
import {Container, Group, ScrollArea, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {useMemo, useRef} from "react"
import {useTranslation} from "react-i18next"
import type {AuditLogItem} from "../types"
import auditLogColumns from "./auditLogColumns"
import Search from "./Search"
import useAuditLogTable from "./useAuditLogTable"

import {useAppDispatch} from "@/app/hooks"
import {
  auditLogPaginationUpdated,
  auditLogSortingUpdated
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {ColumnSelector, DataTable, TablePagination, useTableData} from "kommon"

export default function AuditLogsList() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const {isError, data, queryParams, error, isLoading, isFetching} =
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
  const calculateMinTableWidth = useMemo(() => {
    return visibleColumns.reduce((totalWidth, column) => {
      // Assuming your column definition has a minWidth property
      const minWidth = column.minWidth || 150 // fallback to 150px if not defined
      return totalWidth + minWidth
    }, 0)
  }, [visibleColumns])

  const remainingHeight = useDynamicHeight([actionButtonsRef])

  const handleSortChange = (value: SortState) => {
    dispatch(auditLogSortingUpdated({mode, value}))
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
            totalItems={data?.total_items}
            t={t}
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
            column: queryParams.sort_by,
            direction: queryParams.sort_direction || null
          }}
          onSortChange={handleSortChange}
          columnWidths={state.columnWidths}
          onColumnResize={actions.setColumnWidth}
          loading={isLoading || isFetching}
          emptyMessage="No audit logs found"
          style={{minWidth: `${calculateMinTableWidth}px`}}
        />
      </ScrollArea>
    </Stack>
  )
}
