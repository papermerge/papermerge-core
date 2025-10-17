import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import useRoleTable from "@/features/roles/hooks/useRoleTable"
import useVisibleColumns from "@/features/roles/hooks/useVisibleColumns"
import {
  selectDetailsEntityId,
  selectFilters,
  selectPageSize,
  selectSelectedIDs
} from "@/features/roles/storage/role"
import {showRoleDetailsInSecondaryPanel} from "@/features/roles/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Group, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useNavigate} from "react-router-dom"
import type {RoleItem} from "../types"
import roleColumns from "./columns"

import {usePanelMode} from "@/hooks"
import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"

export default function RolesList() {
  const {t} = useTranslation()
  const {panelId, actions} = usePanel()
  const selectedIDs = useAppSelector(state => selectSelectedIDs(state, panelId))
  const pageSize = useAppSelector(state => selectPageSize(state, panelId))
  const filters = useAppSelector(state => selectFilters(state, panelId))

  const mode = usePanelMode()
  const selectedRowIDs = useAppSelector(s => selectSelectedIDs(s, mode))
  const selectedRowsSet = new Set(selectedRowIDs || [])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const visibleColumns = useVisibleColumns(roleColumns(t))
  const roleDetailsID = useAppSelector(state =>
    selectDetailsEntityId(state, panelId)
  )

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useRoleTable()

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

  const getRowId = (row: RoleItem) => row.id

  const onTableRowClick = (row: RoleItem, openInSecondaryPanel: boolean) => {
    if (openInSecondaryPanel) {
      dispatch(showRoleDetailsInSecondaryPanel(row.id))
    } else {
      navigate(`/roles/${row.id}`)
    }
  }

  if (isError && isHTTP403Forbidden(error)) {
    navigate(ERRORS_403_ACCESS_FORBIDDEN)
  }

  return (
    <Stack style={{height: "100%"}}>
      <Group w={"100%"}>
        <ActionButtons />
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
        emptyMessage={t("rolesList.noRolesFound", {
          defaultValue: "No roles found"
        })}
        withCheckbox={true}
        selectedRows={selectedRowsSet}
        onSelectionChange={handleSelectionChange}
        onRowClick={onTableRowClick}
        getRowId={getRowId}
        highlightRowID={roleDetailsID}
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
