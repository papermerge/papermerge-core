import useAuditLogTable from "@/features/audit/hooks/useAuditLogTable"
import {Container, Group, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {useTranslation} from "react-i18next"
import type {AuditLogItem} from "../types"
import Search from "./Search"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import useVisibleColumns from "@/features/audit/hooks/useVisibleColumns"
import {showAuditLogDetailsInSecondaryPanel} from "@/features/audit/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelDetailsEntityId} from "@/features/ui/panelRegistry"

import {DataTable, TablePagination} from "kommon"
import {useNavigate} from "react-router"
import auditLogColumns from "./auditLogColumns"
import ColumnSelector from "./ColumnSelectorContainer"

export default function AuditLogsList() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const {panelId, actions} = usePanel()
  const navigate = useNavigate()
  const {isError, data, queryParams, error, isLoading, isFetching} =
    useAuditLogTable()

  const auditLogDetailsID = useAppSelector(s =>
    selectPanelDetailsEntityId(s, "secondary")
  )

  const visibleColumns = useVisibleColumns(auditLogColumns(t))

  const handleSortChange = (value: SortState) => {
    actions.updateSorting(value)
  }

  const handleSelectionChange = (newSelection: Set<string>) => {
    const arr = Array.from(newSelection)
    actions.setSelection(arr)
  }

  const handlePageSizeChange = (newValue: number) => {
    actions.updatePagination({pageSize: newValue})
  }

  const handlePageNumberChange = (pageNumber: number) => {
    actions.updatePagination({pageNumber})
  }

  const onTableRowClick = (
    row: AuditLogItem,
    openInSecondaryPanel: boolean
  ) => {
    if (openInSecondaryPanel) {
      dispatch(showAuditLogDetailsInSecondaryPanel(row.id))
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
    <Stack gap="xs" style={{height: "100%"}}>
      <Group justify={"end"} align="center">
        <Search />
        <ColumnSelector />
      </Group>

      <DataTable
        data={data?.items || []}
        columns={visibleColumns}
        sorting={{
          column: queryParams.sort_by,
          direction: queryParams.sort_direction || null
        }}
        onSortChange={handleSortChange}
        loading={isLoading || isFetching}
        emptyMessage={t?.("auditLog.noAuditLogsFound") || "No audit logs found"}
        onRowClick={onTableRowClick}
        highlightRowID={auditLogDetailsID}
      />

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
