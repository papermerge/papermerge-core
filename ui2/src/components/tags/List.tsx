import {useState} from "react"
import {Center, Stack, Table, Checkbox, Loader} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  selectionAddMany,
  selectSelectedIds,
  clearSelection,
  selectLastPageSize,
  lastPageSizeUpdate
} from "@/slices/tags"
import {useGetPaginatedTagsQuery} from "@/features/tags/apiSlice"

import Pagination from "@/components/Pagination"
import TagRow from "./TagRow"
import ActionButtons from "./ActionButtons"

export default function TagsList() {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()
  const lastPageSize = useSelector(selectLastPageSize)

  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)

  const {data, isLoading, isFetching} = useGetPaginatedTagsQuery({
    page_number: page,
    page_size: pageSize
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

  if (isLoading || !data) {
    return (
      <Stack>
        <ActionButtons />
        <Center>
          <Loader type="bars" />
        </Center>
      </Stack>
    )
  }

  if (data.items.length == 0) {
    return (
      <div>
        <ActionButtons />
        <Empty />
      </div>
    )
  }

  const tagRows = data?.items.map(t => <TagRow key={t.id} tag={t} />)

  return (
    <Stack>
      <ActionButtons /> {isFetching && <Loader size={"sm"} />}
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox
                checked={data.items.length == selectedIds.length}
                onChange={e => onCheckAll(e.currentTarget.checked)}
              />
            </Table.Th>
            <Table.Th>Name</Table.Th>
            <Table.Th>Pinned?</Table.Th>
            <Table.Th>Description</Table.Th>
            <Table.Th>ID</Table.Th>
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
  return (
    <Center>
      <Stack align="center">
        <div>Currently there are no tags</div>
      </Stack>
    </Center>
  )
}
