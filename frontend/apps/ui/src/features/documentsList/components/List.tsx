import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import PanelToolbar from "@/components/DualPanel/PanelToolbar"
import useVisibleColumns from "@/features/documentsList/hooks/useVisibleColumns"
import {showDocumentDetailsInSecondaryPanel} from "@/features/documentsList/storage/thunks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelDetailsEntityId} from "@/features/ui/panelRegistry"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useTranslation} from "react-i18next"
import {useNavigate} from "react-router-dom"
import useDocumentsListTable from "../hooks/useDocumentsListTable"
import {DocumentListItem} from "../types"
import ColumnSelectorContainer from "./ColumnSelector"

export default function DocumentsListByCategory() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const {actions} = usePanel()

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useDocumentsListTable()

  const visibleColumns = useVisibleColumns(data)
  const currentDetailsPanelDocID = useAppSelector(s =>
    selectPanelDetailsEntityId(s, "secondary")
  )

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

  const getRowId = (row: DocumentListItem) => row.id

  const onTableRowClick = (
    row: DocumentListItem,
    openInSecondaryPanel: boolean,
    event?: React.MouseEvent
  ) => {
    // Check for new tab intent (Ctrl/Cmd+click or middle-click)
    const openInNewTab =
      event && (event.ctrlKey || event.metaKey || event.button === 1)

    if (openInNewTab) {
      const url = `/document/${row.id}`
      window.open(url, "_blank")
      return
    }

    if (openInSecondaryPanel) {
      dispatch(showDocumentDetailsInSecondaryPanel(row.id))
    } else {
      navigate(`/document/${row.id}`)
    }
  }

  if (isError && isHTTP403Forbidden(error)) {
    navigate(ERRORS_403_ACCESS_FORBIDDEN)
  }

  return (
    <Stack style={{height: "100%"}}>
      <PanelToolbar rightActions={<ColumnSelectorContainer />} />

      <DataTable
        //@ts-ignore
        data={data?.items || []}
        columns={visibleColumns}
        sorting={{
          column: queryParams.sort_by,
          direction: queryParams.sort_direction || null
        }}
        onSortChange={handleSortChange}
        loading={isLoading || isFetching}
        withCheckbox={true}
        onRowClick={onTableRowClick}
        getRowId={getRowId}
        highlightRowID={currentDetailsPanelDocID}
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
