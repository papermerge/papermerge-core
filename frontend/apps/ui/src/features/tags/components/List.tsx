import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import useTagTable from "@/features/tags/hooks/useTagTable"
import useVisibleColumns from "@/features/tags/hooks/useVisibleColumns"
import {showTagDetailsInSecondaryPanel} from "@/features/tags/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {
  selectPanelDetailsEntityId,
  selectPanelSelectedIDs
} from "@/features/ui/panelRegistry"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Group, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useNavigate} from "react-router-dom"
import type {TagItem} from "../types"
import tagColumns from "./columns"

import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"

export default function TagsList() {
  const {t} = useTranslation()
  const {panelId, actions} = usePanel()
  const selectedRowIDs = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const selectedRowsSet = new Set(selectedRowIDs || [])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const visibleColumns = useVisibleColumns(tagColumns(t))
  const tagDetailsID = useAppSelector(s =>
    selectPanelDetailsEntityId(s, "secondary")
  )

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useTagTable()

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

  const getRowId = (row: TagItem) => row.id

  const onTableRowClick = (row: TagItem, openInSecondaryPanel: boolean) => {
    if (openInSecondaryPanel) {
      dispatch(showTagDetailsInSecondaryPanel(row.id))
    } else {
      navigate(`/tags/${row.id}`)
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
        emptyMessage={t("tags.noTagsFound", {
          defaultValue: "No tags found"
        })}
        withCheckbox={true}
        selectedRows={selectedRowsSet}
        onSelectionChange={handleSelectionChange}
        onRowClick={onTableRowClick}
        getRowId={getRowId}
        highlightRowID={tagDetailsID}
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
