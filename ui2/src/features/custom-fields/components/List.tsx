import {Checkbox, Group, Stack, Table} from "@mantine/core"

export default function CustomFieldsList() {
  return (
    <Stack>
      <Group></Group>
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>
              <Checkbox />
            </Table.Th>
            <Table.Th>Name</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody></Table.Tbody>
      </Table>
    </Stack>
  )
}
