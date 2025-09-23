import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import useGroupTable from "@/features/groups/hooks/useGroupTable"
import useVisibleColumns from "@/features/groups/hooks/useVisibleColumns"
import {
  groupListSortingUpdated,
  groupPaginationUpdated,
  selectGroupDetailsID,
  selectionSet,
  selectSelectedIDs
} from "@/features/groups/storage/group"
import {showGroupDetailsInSecondaryPanel} from "@/features/groups/storage/thunks"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Group, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useNavigate} from "react-router-dom"
import type {GroupItem} from "../types"
import groupColumns from "./columns"

import {usePanelMode} from "@/hooks"
import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"

export default function GroupsList() {
  const {t} = useTranslation()
  const mode = usePanelMode()
  const selectedRowIDs = useAppSelector(s => selectSelectedIDs(s, mode))
  const selectedRowsSet = new Set(selectedRowIDs || [])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const visibleColumns = useVisibleColumns(groupColumns(t))
  const groupDetailsID = useAppSelector(s =>
    selectGroupDetailsID(s, "secondary")
  )

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useGroupTable()

  const handleSortChange = (value: SortState) => {
    dispatch(groupListSortingUpdated({mode, value}))
  }

  const handleSelectionChange = (newSelection: Set<string>) => {
    const newIds = Array.from(newSelection)
    dispatch(selectionSet({ids: newIds, mode}))
  }

  const handlePageSizeChange = (newValue: number) => {
    dispatch(
      groupPaginationUpdated({
        mode,
        value: {
          pageSize: newValue,
          pageNumber: 1
        }
      })
    )
  }

  const handlePageNumberChange = (pageNumber: number) => {
    dispatch(groupPaginationUpdated({mode, value: {pageNumber}}))
  }

  const getRowId = (row: GroupItem) => row.id

  const onTableRowClick = (row: GroupItem, openInSecondaryPanel: boolean) => {
    if (openInSecondaryPanel) {
      dispatch(showGroupDetailsInSecondaryPanel(row.id))
    } else {
      navigate(`/groups/${row.id}`)
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
        emptyMessage={t("groups.noGroupsFound", {
          defaultValue: "No groups found"
        })}
        withCheckbox={true}
        selectedRows={selectedRowsSet}
        onSelectionChange={handleSelectionChange}
        onRowClick={onTableRowClick}
        getRowId={getRowId}
        highlightRowID={groupDetailsID}
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
