import Pagination from "@/components/Pagination"
import Th from "@/components/TableSort/Th"
import {useGetPaginatedCustomFieldsQuery} from "@/features/custom-fields/apiSlice"
import {
  clearSelection,
  filterUpdated,
  lastPageSizeUpdate,
  selectLastPageSize,
  selectReverseSortedByName,
  selectReverseSortedByType,
  selectSelectedIds,
  selectSortedByName,
  selectSortedByType,
  selectTableSortColumns,
  selectionAddMany,
  sortByUpdated
} from "@/features/custom-fields/customFieldsSlice"
import {Center, Checkbox, Loader, Stack, Table} from "@mantine/core"
import {useState} from "react"
import {useDispatch, useSelector} from "react-redux"
import type {CustomFieldListColumnName} from "../types"
import ActionButtons from "./ActionButtons"
import CustomFieldRow from "./CustomFieldRow"

export default function CustomFieldsList() {
  const selectedIds = useSelector(selectSelectedIds)
  const tablerSortCols = useSelector(selectTableSortColumns)
  const sortedByName = useSelector(selectSortedByName)
  const sortedByType = useSelector(selectSortedByType)
  const reverseSortedByName = useSelector(selectReverseSortedByName)
  const reverseSortedByType = useSelector(selectReverseSortedByType)
  const dispatch = useDispatch()
  const lastPageSize = useSelector(selectLastPageSize)
  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(10)
  const {data, isLoading, isFetching} = useGetPaginatedCustomFieldsQuery({
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

  const onSortBy = (columnName: CustomFieldListColumnName) => {
    dispatch(sortByUpdated(columnName))
  }

  const onPageSizeChange = (value: string | null) => {
    if (value) {
      const pageSize = parseInt(value)

      dispatch(lastPageSizeUpdate(pageSize))
      setPageSize(pageSize)
    }
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
  const customFieldRows = data.items.map(cf => (
    <CustomFieldRow key={cf.id} customField={cf} />
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
            <Th
              sorted={sortedByType}
              reversed={reverseSortedByType}
              onSort={() => onSortBy("type")}
            >
              Type
            </Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{customFieldRows}</Table.Tbody>
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
        <div>Currently there are no custom fields</div>
      </Stack>
    </Center>
  )
}
