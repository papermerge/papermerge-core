import {useGetSharedNodeAccessDetailsQuery} from "@/features/shared_nodes/apiSlice"
import {Checkbox, Skeleton, Stack, Table} from "@mantine/core"

import UserAccessButtons from "./UserAccessButtons"
import UserRow from "./UserRow"
import type {IDType} from "./type"

interface Args {
  node_id: string
  selectedIDs: string[]
  onSelectionChange: (user_id: string, checked: boolean) => void
  onClickViewButton: (sel_id: string, idType: IDType) => void
  onClickDeleteButton: (sel_id: string, idType: IDType) => void
}

export default function ManageAccessUsers({
  node_id,
  selectedIDs,
  onSelectionChange,
  onClickDeleteButton,
  onClickViewButton
}: Args) {
  const {data, isLoading} = useGetSharedNodeAccessDetailsQuery(node_id)

  if (isLoading || !data) {
    return <Skeleton height={50} />
  }

  const userRows = data.users.map(u => (
    <UserRow
      selectedIDs={selectedIDs}
      onChange={onSelectionChange}
      key={u.id}
      user={u}
    />
  ))

  return (
    <Stack my={"sm"}>
      <UserAccessButtons
        selectedIDs={selectedIDs}
        onClickDeleteButton={onClickDeleteButton}
        onClickViewButton={onClickViewButton}
      />
      <Table withTableBorder withColumnBorders my={"sm"}>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox />
            </Table.Th>
            <Table.Th>User</Table.Th>
            <Table.Th>Roles</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{userRows}</Table.Tbody>
      </Table>
    </Stack>
  )
}
