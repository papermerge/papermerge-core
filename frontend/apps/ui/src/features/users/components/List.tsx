import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelDetailsEntityId,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"
import useUserTable from "@/features/users/hooks/useUserTable"
import useVisibleColumns from "@/features/users/hooks/useVisibleColumns"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useTranslation} from "react-i18next"

import {showUserDetailsInSecondaryPanel} from "@/features/users/storage/thunks"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Group, Stack} from "@mantine/core"
import {useNavigate} from "react-router-dom"
import type {UserItem} from "../types"
import ActionButtons from "./ActionButtons"
import userColumns from "./columns"

export default function UsersList() {
  const {t} = useTranslation()
  const {panelId, actions} = usePanel()

  const selectedRowIDs = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const selectedRowsSet = new Set(selectedRowIDs || [])

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const visibleColumns = useVisibleColumns(userColumns(t))
  const entityDetailsID = useAppSelector(state =>
    selectPanelDetailsEntityId(state, panelId)
  )
  const {isError, data, queryParams, error, isLoading, isFetching} =
    useUserTable()

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

  const getRowId = (row: UserItem) => row.id

  const onTableRowClick = (row: UserItem, openInSecondaryPanel: boolean) => {
    if (openInSecondaryPanel) {
      dispatch(showUserDetailsInSecondaryPanel(row.id))
    } else {
      navigate(`/users/${row.id}`)
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
        emptyMessage={t("usersList.noUsersFound", {
          defaultValue: "No users found"
        })}
        withCheckbox={true}
        selectedRows={selectedRowsSet}
        onSelectionChange={handleSelectionChange}
        onRowClick={onTableRowClick}
        getRowId={getRowId}
        highlightRowID={entityDetailsID}
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
