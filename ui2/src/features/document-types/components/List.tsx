import Pagination from "@/components/Pagination"
import Th from "@/components/TableSort/Th"
import {useGetPaginatedDocumentTypesQuery} from "@/features/document-types/apiSlice"
import {
  clearSelection,
  filterUpdated,
  lastPageSizeUpdate,
  selectLastPageSize,
  selectReverseSortedByName,
  selectSelectedIds,
  selectSortedByName,
  selectTableSortColumns,
  selectionAddMany,
  sortByUpdated
} from "@/features/document-types/documentTypesSlice"
import type {DocumentTypeListColumnName} from "@/features/document-types/types"
import {Center, Checkbox, Loader, Stack, Table} from "@mantine/core"
import {useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import ActionButtons from "./ActionButtons"
import DocumentTypeRow from "./DocumentTypeRow"

export default function DocumentTypesList() {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()
  const lastPageSize = useSelector(selectLastPageSize)
  const tablerSortCols = useSelector(selectTableSortColumns)
  const sortedByName = useSelector(selectSortedByName)
  const reverseSortedByName = useSelector(selectReverseSortedByName)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const {data, isLoading, isFetching} = useGetPaginatedDocumentTypesQuery({
    page_number: page,
    page_size: pageSize,
    sort_by: tablerSortCols.sortBy,
    filter: tablerSortCols.filter
  })

  const onCheckAll = (checked: boolean) => {
    if (!data) {
      console.log(`undefined data`)
      return
    }

    if (checked) {
      // check all/select all group items
      dispatch(selectionAddMany(data.items.map(i => i.id)))
    } else {
      // uncheck all/unselect all group items
      dispatch(clearSelection())
    }
  }

  const onPageNumberChange = (page: number) => {
    setPage(page)
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      const pageSize = parseInt(value)

      dispatch(lastPageSizeUpdate(pageSize))
      setPageSize(pageSize)
    }
  }

  const onSortBy = (columnName: DocumentTypeListColumnName) => {
    dispatch(sortByUpdated(columnName))
  }

  const onQuickFilterChange = (value: string) => {
    dispatch(filterUpdated(value))
    setPage(1)
  }

  const onQuickFilterClear = () => {
    dispatch(filterUpdated(undefined))
    setPage(1)
  }

  if (isLoading || !data) {
    return (
      <Stack>
        <ActionButtons
          onQuickFilterChange={onQuickFilterChange}
          onQuickFilterClear={onQuickFilterClear}
        />
        <Center>
          <Loader type="bars" />
        </Center>
      </Stack>
    )
  }

  if (data.items.length == 0) {
    return (
      <div>
        <ActionButtons
          onQuickFilterChange={onQuickFilterChange}
          onQuickFilterClear={onQuickFilterClear}
        />
        <Empty />
      </div>
    )
  }
  const documentTypeRows = data.items.map(dt => (
    <DocumentTypeRow key={dt.id} documentType={dt} />
  ))

  return (
    <Stack>
      <ActionButtons
        isFetching={isFetching}
        onQuickFilterChange={onQuickFilterChange}
        onQuickFilterClear={onQuickFilterClear}
      />

      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox
                checked={data.items.length == selectedIds.length}
                onChange={e => onCheckAll(e.currentTarget.checked)}
              />
            </Table.Th>
            <Th
              sorted={sortedByName}
              reversed={reverseSortedByName}
              onSort={() => onSortBy("name")}
            >
              Name
            </Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{documentTypeRows}</Table.Tbody>
      </Table>
      <Pagination
        pagination={{
          pageNumber: page,
          pageSize: pageSize,
          numPages: data.num_pages
        }}
        onPageNumberChange={onPageNumberChange}
        onPageSizeChange={onPageSizeChange}
        lastPageSize={lastPageSize}
      />
    </Stack>
  )
}

function Empty() {
  return (
    <Center>
      <Stack align="center">
        <div>Currently there are no document types</div>
      </Stack>
    </Center>
  )
}
