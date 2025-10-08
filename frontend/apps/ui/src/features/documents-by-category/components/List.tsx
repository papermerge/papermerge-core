import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {ERRORS_403_ACCESS_FORBIDDEN} from "@/cconstants"
import PanelContext from "@/contexts/PanelContext"
import documentByCategoryColumns from "@/features/documents-by-category/components/columns"
import useDocumentsByCategoryTable from "@/features/documents-by-category/hooks/useDocumentsByCategoryTable"
import useVisibleColumns from "@/features/documents-by-category/hooks/useVisibleColumns"
import {
  documentsByCategoryListSortingUpdated,
  documentsByCategoryPaginationUpdated,
  selectCurrentDocumentID,
  selectDocumentCategoryID
} from "@/features/documents-by-category/storage/documentsByCategory"
import {showDocumentDetailsInSecondaryPanel} from "@/features/documents-by-category/storage/thunks"
import {isHTTP403Forbidden} from "@/services/helpers"
import type {PanelMode} from "@/types"
import {Group, Stack} from "@mantine/core"
import type {SortState} from "kommon"
import {DataTable, TablePagination} from "kommon"
import {useContext} from "react"
import {useTranslation} from "react-i18next"
import {useNavigate} from "react-router-dom"
import {DocumentByCategoryItem} from "../types"
import ActionButtons from "./ActionButtons"
import PickupDocumentCategory from "./PickupDocumentCategory"

export default function DocumentsListByCagegory() {
  const {t} = useTranslation()
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const mode: PanelMode = useContext(PanelContext)
  const categoryID = useAppSelector(s => selectDocumentCategoryID(s, mode))
  const {isError, data, queryParams, error, isLoading, isFetching} =
    useDocumentsByCategoryTable()
  const visibleColumns = useVisibleColumns(
    documentByCategoryColumns({items: data?.items, t})
  )
  const currentDetailsPanelDocID = useAppSelector(s =>
    selectCurrentDocumentID(s, "secondary")
  )

  const handleSortChange = (value: SortState) => {
    dispatch(documentsByCategoryListSortingUpdated({mode, value}))
  }

  const handlePageSizeChange = (newValue: number) => {
    dispatch(
      documentsByCategoryPaginationUpdated({
        mode,
        value: {
          pageSize: newValue,
          pageNumber: 1
        }
      })
    )
  }

  const handlePageNumberChange = (pageNumber: number) => {
    dispatch(documentsByCategoryPaginationUpdated({mode, value: {pageNumber}}))
  }

  const getRowId = (row: DocumentByCategoryItem) => row.id

  const onTableRowClick = (
    row: DocumentByCategoryItem,
    openInSecondaryPanel: boolean
  ) => {
    if (openInSecondaryPanel) {
      dispatch(showDocumentDetailsInSecondaryPanel(row.id))
    } else {
      navigate(`/document/${row.id}`)
    }
  }

  if (!categoryID) {
    return <PickupDocumentCategory />
  }

  if (isError && isHTTP403Forbidden(error)) {
    navigate(ERRORS_403_ACCESS_FORBIDDEN)
  }

  return (
    <Stack style={{height: "100%"}}>
      <Group w={"100%"}>
        <ActionButtons items={data?.items || []} />
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
