import {
  Modal,
  Container,
  Space,
  Group,
  Button,
  TextInput,
  Table,
  Checkbox
} from "@mantine/core"

type Args = {
  opened: boolean
  onClose: () => void
}

export default function GroupModal({opened, onClose}: Args) {
  return (
    <Modal opened={opened} size={"xl"} onClose={onClose} title="New Group">
      <Container>
        <TextInput label="Name" placeholder="name" />
        <Table>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Permissions</Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
              <Table.Th></Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            <Table.Tr key="document">
              <Table.Td>
                <Checkbox defaultChecked label="Documents" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Upload" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Download" />
              </Table.Td>
            </Table.Tr>
            <Table.Tr key="users">
              <Table.Td>
                <Checkbox defaultChecked label="Users" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="View" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Create" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Update" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Delete" />
              </Table.Td>
            </Table.Tr>
            <Table.Tr key="group">
              <Table.Td>
                <Checkbox defaultChecked label="Groups" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="View" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Create" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Update" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Delete" />
              </Table.Td>
            </Table.Tr>
            <Table.Tr key="tags">
              <Table.Td>
                <Checkbox defaultChecked label="Tags" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="View" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Create" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Update" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Delete" />
              </Table.Td>
            </Table.Tr>
            <Table.Tr key="nodes">
              <Table.Td>
                <Checkbox defaultChecked label="Nodes" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="View" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Create" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Update" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Delete" />
              </Table.Td>
              <Table.Td>
                <Checkbox defaultChecked label="Move" />
              </Table.Td>
            </Table.Tr>
          </Table.Tbody>
        </Table>
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={() => {}}>Create Group</Button>
        </Group>
      </Container>
    </Modal>
  )
}
