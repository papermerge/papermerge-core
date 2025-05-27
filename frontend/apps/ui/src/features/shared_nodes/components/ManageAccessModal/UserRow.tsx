import {User} from "@/types.d/shared_nodes"
import {Checkbox, Table} from "@mantine/core"

interface Args {
  user: User
  selectedIDs: string[]
  onChange: (user_id: string, checked: boolean) => void
}

export default function UserRow({user, selectedIDs, onChange}: Args) {
  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      onChange(user.id, true)
    } else {
      onChange(user.id, false)
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          checked={selectedIDs.includes(user.id)}
          onChange={onLocalChange}
        />
      </Table.Td>
      <Table.Td>{user.username}</Table.Td>
      <Table.Td>{user.roles.map(r => r.name).join(",")}</Table.Td>
    </Table.Tr>
  )
}
