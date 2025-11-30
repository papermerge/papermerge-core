import useVisibleColumns from "@/hooks/useVisibleColumns"
import {Stack} from "@mantine/core"

import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {
  selectPanelSelectedIDs,
  updatePanelCurrentNode
} from "@/features/ui/panelRegistry"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useTranslation} from "react-i18next"
import {useNavigate} from "react-router-dom"

import {usePanel} from "@/features/ui/hooks/usePanel"
import type {NodeType} from "@/types"

import useNodes from "@/features/shared_nodes/hooks/useNodes"
import nodeColumns from "./columns"

export default function Commander() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const {panelId} = usePanel()

  const selectedItemIDs = useAppSelector(s =>
    selectPanelSelectedIDs(s, panelId)
  )
  const selectedItemsSet = new Set(selectedItemIDs || [])

  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
    error,
    actions,
    currentFolder,
    queryParams
  } = useNodes()

  const visibleColumns = useVisibleColumns(nodeColumns(t))

  const handleSelectionChange = (newSelection: Set<string>) => {
    const arr = Array.from(newSelection)
    actions.setSelection(arr)
  }

  const handleSortChange = (value: SortState) => {
    actions.updateSorting(value)
  }

  const onPageNumberChange = (page: number) => {
    actions.updatePagination({
      pageNumber: page
    })
  }
  const getRowId = (row: NodeType) => row.id

  const onPageSizeChange = (value: number) => {
    if (value) {
      const pSize = value
      actions.updatePagination({
        pageNumber: 1,
        pageSize: pSize
      })
    }
  }

  const onTableRowClick = (row: NodeType, openInSecondaryPanel: boolean) => {
    const component = row.ctype === "document" ? "viewer" : "sharedCommander"

    // Secondary panel always uses dispatch
    if (openInSecondaryPanel || panelId == "secondary") {
      dispatch(
        updatePanelCurrentNode({
          panelID: "secondary",
          entityID: row.id,
          component
        })
      )
      return
    }

    // Main panel navigates
    const path = row.ctype === "folder" ? "shared/folder" : "shared/document"
    navigate(`/${path}/${row.id}`)
  }

  return (
    <Stack style={{height: "100%"}}>
      <DataTable<NodeType>
        data={data?.items || []}
        columns={visibleColumns}
        sorting={{
          column: queryParams.sort_by,
          direction: queryParams.sort_direction || null
        }}
        selectedRows={selectedItemsSet}
        onSortChange={handleSortChange}
        onSelectionChange={handleSelectionChange}
        onRowClick={onTableRowClick}
        withCheckbox={true}
        withSecondaryPanelTriggerColumn={panelId == "main"}
        getRowId={getRowId}
      />
      <TablePagination
        currentPage={data?.page_number || 1}
        totalPages={data?.num_pages || 0}
        pageSize={data?.page_size || 15}
        onPageChange={onPageNumberChange}
        onPageSizeChange={onPageSizeChange}
        totalItems={data?.total_items}
        t={t}
      />
    </Stack>
  )
}
