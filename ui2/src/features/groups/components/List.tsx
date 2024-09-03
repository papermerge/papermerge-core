import {useState} from "react"
import {Group, Center, Stack, Table, Checkbox, Loader} from "@mantine/core"
import {useDispatch, useSelector} from "react-redux"
import {
  selectionAddMany,
  selectSelectedIds,
  clearSelection,
  selectLastPageSize,
  lastPageSizeUpdate
} from "@/features/groups/groupsSlice"
import {useGetPaginatedGroupsQuery} from "@/features/groups/apiSlice"

import Pagination from "@/components/Pagination"
import GroupRow from "./GroupRow"
import ActionButtons from "./ActionButtons"

export default function GroupsList() {
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()
  const lastPageSize = useSelector(selectLastPageSize)

  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)

  const {data, isLoading, isFetching} = useGetPaginatedGroupsQuery({
    page_number: page,
    page_size: pageSize
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

  const groupRows = data.items.map(g => <GroupRow key={g.id} group={g} />)

  return (
    <Stack>
      <Group>
        <ActionButtons /> {isFetching && <Loader size={"sm"} />}
      </Group>
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
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{groupRows}</Table.Tbody>
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
        <div>Currently there are no groups</div>
      </Stack>
    </Center>
  )
}
