import type {User} from "@/types.d/shared_nodes"
import {SharedNodeAccessDetails} from "@/types.d/shared_nodes"
import {Checkbox, Skeleton, Stack, Table} from "@mantine/core"
import UserAccessButtons from "./UserAccessButtons"
import UserRow from "./UserRow"
import type {IDType} from "./type"

interface Args {
  data?: SharedNodeAccessDetails
  selectedIDs: string[]
  onSelectionChange: (user_id: string, checked: boolean) => void
  onClickViewButton: (sel_id: string, idType: IDType) => void
  onClickDeleteButton: (sel_id: string, idType: IDType) => void
}

export default function ManageAccessUsers({
  data,
  selectedIDs,
  onSelectionChange,
  onClickDeleteButton,
  onClickViewButton
}: Args) {
  if (!data) {
    return <Skeleton my={"lg"} height={30}></Skeleton>
  }

  const userRows = Array.from(data.users)
    .sort(sortPredicate)
    .map(u => (
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

function sortPredicate(u1: User, u2: User) {
  const username1 = u1.username.toLowerCase()
  const username2 = u2.username.toLowerCase()

  if (username1 < username2) {
    return -1
  }
  if (username1 > username2) {
    return 1
  }

  // names must be equal
  return 0
}
