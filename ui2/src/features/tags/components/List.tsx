import Th from "@/components/TableSort/Th"
import {useGetPaginatedTagsQuery} from "@/features/tags/apiSlice"
import {
  clearSelection,
  filterUpdated,
  lastPageSizeUpdate,
  selectLastPageSize,
  selectReverseSortedByDescription,
  selectReverseSortedByID,
  selectReverseSortedByName,
  selectReverseSortedByOwner,
  selectReverseSortedByPinned,
  selectSelectedIds,
  selectSortedByDescription,
  selectSortedByID,
  selectSortedByName,
  selectSortedByOwner,
  selectSortedByPinned,
  selectTableSortColumns,
  selectionAddMany,
  sortByUpdated
} from "@/features/tags/tagsSlice"
import {Center, Checkbox, Loader, Stack, Table} from "@mantine/core"
import {useState} from "react"
import {useDispatch, useSelector} from "react-redux"

import Pagination from "@/components/Pagination"
import type {TagsListColumnName} from "../types"
import ActionButtons from "./ActionButtons"
import TagRow from "./TagRow"
import {useTranslation} from "react-i18next"

export default function TagsList() {
  const {t} = useTranslation()
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()
  const tableSortCols = useSelector(selectTableSortColumns)
  const lastPageSize = useSelector(selectLastPageSize)
  const sortedByName = useSelector(selectSortedByName)
  const sortedByPinned = useSelector(selectSortedByPinned)
  const sortedByDescription = useSelector(selectSortedByDescription)
  const sortedByID = useSelector(selectSortedByID)
  const sortedByOwner = useSelector(selectSortedByOwner)
  const reverseSortedByName = useSelector(selectReverseSortedByName)
  const reverseSortedByPinned = useSelector(selectReverseSortedByPinned)
  const reverseSortedByDescription = useSelector(
    selectReverseSortedByDescription
  )
  const reverseSortedByID = useSelector(selectReverseSortedByID)
  const reverseSortedByOwner = useSelector(selectReverseSortedByOwner)

  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)

  const {data, isLoading, isFetching} = useGetPaginatedTagsQuery({
    page_number: page,
    page_size: pageSize,
    sort_by: tableSortCols.sortBy,
    filter: tableSortCols.filter
  })

  const onCheckAll = (checked: boolean) => {
    if (!data) {
      console.log(`undefined data`)
      return
    }

    if (checked) {
      dispatch(selectionAddMany(data.items.map(i => i.id)))
    } else {
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

  const onSortBy = (columnName: TagsListColumnName) => {
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

  const tagRows = data?.items.map(t => <TagRow key={t.id} tag={t} />)

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
              {t("common.table.columns.name")}
            </Th>
            <Th
              sorted={sortedByPinned}
              reversed={reverseSortedByPinned}
              onSort={() => onSortBy("pinned")}
            >
              {t("common.table.columns.pinned")}?
            </Th>
            <Th
              sorted={sortedByDescription}
              reversed={reverseSortedByDescription}
              onSort={() => onSortBy("description")}
            >
              {t("common.table.columns.description")}
            </Th>
            <Th
              sorted={sortedByOwner}
              reversed={reverseSortedByOwner}
              onSort={() => onSortBy("group_name")}
            >
              Owner
            </Th>
            <Th
              sorted={sortedByID}
              reversed={reverseSortedByID}
              onSort={() => onSortBy("ID")}
            >
              ID
            </Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{tagRows}</Table.Tbody>
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
  const {t} = useTranslation()
  return (
    <Center>
      <Stack align="center">
        <div>{t("tags.list.empty")}</div>
      </Stack>
    </Center>
  )
}
