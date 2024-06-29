import {Table, Checkbox} from "@mantine/core"
import type {Group} from "@/types"

type Args = {
  group: Group
}

export default function GroupRow({group}: Args) {
  return (
    <Table.Tr>
      <Table.Td>
        <Checkbox />
      </Table.Td>
      <Table.Td>{group.name}</Table.Td>
    </Table.Tr>
  )
}
