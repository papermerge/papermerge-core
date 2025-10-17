import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import useDocumentTypeTable from "@/features/document-types/hooks/useDocumentTypeTable"
import useVisibleColumns from "@/features/document-types/hooks/useVisibleColumns"
import {showDocumentTypeDetailsInSecondaryPanel} from "@/features/document-types/storage/thunks"
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
import type {DocumentTypeItem} from "../types"
import documentTypeColumns from "./columns"

import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"

export default function DocumentTypesList() {
  const {t} = useTranslation()
  const {panelId, actions} = usePanel()

  const selectedRowIDs = useAppSelector(s => selectPanelSelectedIDs(s, panelId))
  const selectedRowsSet = new Set(selectedRowIDs || [])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const visibleColumns = useVisibleColumns(documentTypeColumns(t))
  const documentTypeDetailsID = useAppSelector(s =>
    selectPanelDetailsEntityId(s, panelId)
  )

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useDocumentTypeTable()

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

  const getRowId = (row: DocumentTypeItem) => row.id

  const onTableRowClick = (
    row: DocumentTypeItem,
    openInSecondaryPanel: boolean
  ) => {
    if (openInSecondaryPanel) {
      dispatch(showDocumentTypeDetailsInSecondaryPanel(row.id))
    } else {
      navigate(`/categories/${row.id}`)
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
        emptyMessage={t("documentTypes.noDocumentTypesFound", {
          defaultValue: "No categories found"
        })}
        withCheckbox={true}
        selectedRows={selectedRowsSet}
        onSelectionChange={handleSelectionChange}
        onRowClick={onTableRowClick}
        getRowId={getRowId}
        highlightRowID={documentTypeDetailsID}
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
