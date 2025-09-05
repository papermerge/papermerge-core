import useAuditLogTable from "@/features/audit/hooks/useAuditLogTable"
import {useDynamicHeight} from "@/hooks/useDynamicHeight"
import {Container, Group, ScrollArea, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {useMemo, useRef} from "react"
import {useTranslation} from "react-i18next"
import type {AuditLogItem} from "../types"
import Search from "./Search"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import useVisibleColumns from "@/features/audit/hooks/useVisibleColumns"
import {
  auditLogPaginationUpdated,
  auditLogSortingUpdated,
  secondaryPanelAuditLogDetailsUpdated,
  selectAuditLogDetailsID
} from "@/features/ui/uiSlice"
import {usePanelMode} from "@/hooks"
import {DataTable, TablePagination} from "kommon"
import {useNavigate} from "react-router"
import auditLogColumns from "./auditLogColumns"
import ColumnSelector from "./ColumnSelectorContainer"

export default function AuditLogsList() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const mode = usePanelMode()
  const navigate = useNavigate()
  const {isError, data, queryParams, error, isLoading, isFetching} =
    useAuditLogTable()
  const actionButtonsRef = useRef<HTMLDivElement>(null)
  const auditLogDetailsID = useAppSelector(s =>
    selectAuditLogDetailsID(s, "secondary")
  )

  const visibleColumns = useVisibleColumns(auditLogColumns(t))

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

  const onTableRowClick = (
    row: AuditLogItem,
    openInSecondaryPanel: boolean
  ) => {
    if (openInSecondaryPanel) {
      dispatch(secondaryPanelAuditLogDetailsUpdated(row.id))
    } else {
      navigate(`/audit-logs/${row.id}`)
    }
  }

  if (isError) {
    return (
      <Container size="xl" py="md">
        <div style={{textAlign: "center", padding: "2rem"}}>
          <h3>
            {t?.("auditLog.errorLoadingAuditLogs") ||
              "Error loading audit logs"}
          </h3>
          <p>
            {error?.toString() ||
              t?.("auditLog.anErrorOccurred") ||
              "An error occurred"}
          </p>
        </div>
      </Container>
    )
  }

  return (
    <Stack gap="xs">
      <Group ref={actionButtonsRef} justify={"space-between"} align="center">
        <Search />
        <ColumnSelector />
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
          loading={isLoading || isFetching}
          emptyMessage={
            t?.("auditLog.noAuditLogsFound") || "No audit logs found"
          }
          style={{minWidth: `${calculateMinTableWidth}px`}}
          onRowClick={onTableRowClick}
          highlightRowID={auditLogDetailsID}
        />
      </ScrollArea>
      <TablePagination
        currentPage={data?.page_number || 1}
        totalPages={data?.num_pages || 0}
        pageSize={data?.page_size || 15}
        onPageChange={handlePageNumberChange}
        onPageSizeChange={handlePageSizeChange}
        totalItems={data?.total_items}
        t={t}
      />
    </Stack>
  )
}
