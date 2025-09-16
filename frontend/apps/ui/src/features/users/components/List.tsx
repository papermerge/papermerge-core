import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import useUserTable from "@/features/users/hooks/useUserTable"
import {
  selectionSet,
  selectSelectedIDs,
  selectUserDetailsID,
  userListSortingUpdated,
  userPaginationUpdated
} from "@/features/users/storage/user"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useTranslation} from "react-i18next"

import {showUserDetailsInSecondaryPanel} from "@/features/users/storage/thunks"
import {usePanelMode} from "@/hooks"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Group, Stack} from "@mantine/core"
import {useNavigate} from "react-router-dom"
import type {UserItem} from "../types"
import ActionButtons from "./ActionButtons"

export default function UsersList() {
  const {t} = useTranslation()
  const mode = usePanelMode()
  const selectedRowIDs = useAppSelector(s => selectSelectedIDs(s, mode))
  const selectedRowsSet = new Set(selectedRowIDs || [])

  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const roleDetailsID = useAppSelector(s => selectUserDetailsID(s, "secondary"))

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useUserTable()

  const handleSortChange = (value: SortState) => {
    dispatch(userListSortingUpdated({mode, value}))
  }

  const handleSelectionChange = (newSelection: Set<string>) => {
    const newIds = Array.from(newSelection)
    dispatch(selectionSet({ids: newIds, mode}))
  }

  const handlePageSizeChange = (newValue: number) => {
    dispatch(
      userPaginationUpdated({
        mode,
        value: {
          pageSize: newValue,
          pageNumber: 1
        }
      })
    )
  }

  const handlePageNumberChange = (pageNumber: number) => {
    dispatch(userPaginationUpdated({mode, value: {pageNumber}}))
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
