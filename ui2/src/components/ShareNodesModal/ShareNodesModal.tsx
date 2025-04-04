import {Button, Container, Group, Loader, Modal} from "@mantine/core"
import SelectGroups from "./SelectGroups"
import SelectRoles from "./SelectRoles"
import SelectUsers from "./SelectUsers"

type Args = {
  opened: boolean
  node_ids: Array<string>
  onSubmit: () => void
  onCancel: () => void
}

export const ShareNodesModal = ({
  node_ids,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const onUsersChange = (value: string) => {}
  const onRolesChange = (value: string) => {}
  const onGroupsChange = (value: string) => {}

  const localSubmit = async () => {}

  const localCancel = () => {
    // just close the dialog
    onCancel()
  }

  return (
    <Modal
      title="Share Documents and Folders"
      opened={opened}
      onClose={localCancel}
    >
      <Container>
        Pick users and/or groups with whom you want to share
        <SelectUsers onChange={onUsersChange} />
        <SelectGroups onChange={onGroupsChange} />
        <SelectRoles onChange={onRolesChange} />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localSubmit}>
            Cancel
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={false}
          >
            Share
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
