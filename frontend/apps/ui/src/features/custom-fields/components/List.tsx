import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import useCustomFieldTable from "@/features/custom-fields/hooks/useCustomFieldTable"
import useVisibleColumns from "@/features/custom-fields/hooks/useVisibleColumns"
import {
  customFieldListSortingUpdated,
  customFieldPaginationUpdated,
  selectCustomFieldDetailsID,
  selectionSet,
  selectSelectedIDs
} from "@/features/custom-fields/storage/custom_field"
import {showCustomFieldDetailsInSecondaryPanel} from "@/features/custom-fields/storage/thunks"
import {isHTTP403Forbidden} from "@/services/helpers"
import {Group, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useNavigate} from "react-router-dom"
import type {CustomFieldItem} from "../types"
import customFieldColumns from "./columns"

import {usePanelMode} from "@/hooks"
import {useTranslation} from "react-i18next"
import ActionButtons from "./ActionButtons"

export default function CustomFieldsList() {
  const {t} = useTranslation()
  const mode = usePanelMode()
  const selectedRowIDs = useAppSelector(s => selectSelectedIDs(s, mode))
  const selectedRowsSet = new Set(selectedRowIDs || [])
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const visibleColumns = useVisibleColumns(customFieldColumns(t))
  const customFieldDetailsID = useAppSelector(s =>
    selectCustomFieldDetailsID(s, "secondary")
  )

  const {isError, data, queryParams, error, isLoading, isFetching} =
    useCustomFieldTable()

  const handleSortChange = (value: SortState) => {
    dispatch(customFieldListSortingUpdated({mode, value}))
  }

  const handleSelectionChange = (newSelection: Set<string>) => {
    const newIds = Array.from(newSelection)
    dispatch(selectionSet({ids: newIds, mode}))
  }

  const handlePageSizeChange = (newValue: number) => {
    dispatch(
      customFieldPaginationUpdated({
        mode,
        value: {
          pageSize: newValue,
          pageNumber: 1
        }
      })
    )
  }

  const handlePageNumberChange = (pageNumber: number) => {
    dispatch(customFieldPaginationUpdated({mode, value: {pageNumber}}))
  }

  const getRowId = (row: CustomFieldItem) => row.id

  const onTableRowClick = (
    row: CustomFieldItem,
    openInSecondaryPanel: boolean
  ) => {
    if (openInSecondaryPanel) {
      dispatch(showCustomFieldDetailsInSecondaryPanel(row.id))
    } else {
      navigate(`/custom-fields/${row.id}`)
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
        emptyMessage={t("customFields.noCustomFieldsFound", {
          defaultValue: "No customFields found"
        })}
        withCheckbox={true}
        selectedRows={selectedRowsSet}
        onSelectionChange={handleSelectionChange}
        onRowClick={onTableRowClick}
        getRowId={getRowId}
        highlightRowID={customFieldDetailsID}
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
