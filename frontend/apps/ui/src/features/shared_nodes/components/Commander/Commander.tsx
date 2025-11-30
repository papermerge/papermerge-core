import useVisibleColumns from "@/hooks/useVisibleColumns"

import {useAppSelector} from "@/app/hooks"
import {selectPanelSelectedIDs} from "@/features/ui/panelRegistry"
import type {SortState} from "kommon"
import {DataTable} from "kommon"
import {useTranslation} from "react-i18next"

import {usePanel} from "@/features/ui/hooks/usePanel"
import type {NodeType} from "@/types"

import useNodes from "@/features/shared_nodes/hooks/useNodes"
import nodeColumns from "./columns"

export default function Commander() {
  const {t} = useTranslation()
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

  const onTableRowClick = (row: NodeType, openInSecondaryPanel: boolean) => {}

  return (
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
  )
}
