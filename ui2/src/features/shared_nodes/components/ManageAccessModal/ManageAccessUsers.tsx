import {useGetSharedNodeAccessDetailsQuery} from "@/features/shared_nodes/apiSlice"
import {Checkbox, Skeleton, Stack, Table} from "@mantine/core"
import {useState} from "react"

import UserAccessButtons from "./UserAccessButtons"
import UserRow from "./UserRow"

interface Args {
  node_id: string
}

export default function ManageAccessUsers({node_id}: Args) {
  const [selectedUserIDs, setSelectedUserIDs] = useState<string[]>([])
  const {data, isLoading} = useGetSharedNodeAccessDetailsQuery(node_id)

  const onChange = (user_id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIDs([...selectedUserIDs, user_id])
    } else {
      const newSelIDs = selectedUserIDs.filter(id => id != user_id)
      setSelectedUserIDs(newSelIDs)
    }
  }

  if (isLoading || !data) {
    return <Skeleton height={50} />
  }

  const userRows = data.users.map(u => (
    <UserRow
      selectedIDs={selectedUserIDs}
      onChange={onChange}
      key={u.id}
      user={u}
    />
  ))

  return (
    <Stack>
      <UserAccessButtons selectedIDs={selectedUserIDs} />
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
