import {Group} from "@/types.d/shared_nodes"
import {Checkbox, Table} from "@mantine/core"

interface Args {
  group: Group
  selectedIDs: string[]
  onChange: (group_id: string, checked: boolean) => void
}

export default function UserRow({group, selectedIDs, onChange}: Args) {
  const onLocalChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.currentTarget.checked) {
      onChange(group.id, true)
    } else {
      onChange(group.id, false)
    }
  }

  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox
          checked={selectedIDs.includes(group.id)}
          onChange={onLocalChange}
        />
      </Table.Td>
      <Table.Td>{group.name}</Table.Td>
      <Table.Td>{group.roles.map(r => r.name).join(",")}</Table.Td>
    </Table.Tr>
  )
}
