import {useGetPaginatedRolesQuery} from "@/features/roles/apiSlice"
import {
  clearSelection,
  lastPageSizeUpdate,
  selectionAddMany,
  selectLastPageSize,
  selectSelectedIds
} from "@/features/roles/rolesSlice"
import {Center, Checkbox, Group, Loader, Stack, Table} from "@mantine/core"
import {useState} from "react"
import {useDispatch, useSelector} from "react-redux"

import Pagination from "@/components/Pagination"
import ActionButtons from "./ActionButtons"
import RoleRow from "./RoleRow"
import {useTranslation} from "react-i18next"

export default function RolesList() {
  const {t} = useTranslation()
  const selectedIds = useSelector(selectSelectedIds)
  const dispatch = useDispatch()
  const lastPageSize = useSelector(selectLastPageSize)

  const [page, setPage] = useState<number>(1)
  const [pageSize, setPageSize] = useState<number>(lastPageSize)

  const {data, isLoading, isFetching} = useGetPaginatedRolesQuery({
    page_number: page,
    page_size: pageSize
  })

  const onCheckAll = (checked: boolean) => {
    if (!data) {
      console.log(`undefined data`)
      return
    }

    if (checked) {
      // check all/select all role items
      dispatch(selectionAddMany(data.items.map(i => i.id)))
    } else {
      // uncheck all/unselect all role items
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

  const roleRows = data.items.map(g => <RoleRow key={g.id} role={g} />)

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
            <Table.Th>{t("common.table.columns.name")}</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{roleRows}</Table.Tbody>
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
        <div>{t("roles.list.empty")}</div>
      </Stack>
    </Center>
  )
}
