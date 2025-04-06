import {Button, Container, Group, Loader, Modal} from "@mantine/core"

type Args = {
  opened: boolean
  node_id: string
  onSubmit: () => void
  onCancel: () => void
}

export const ManageAccessModal = ({
  node_id,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const localSubmit = async () => {
    onSubmit()
  }

  const localCancel = () => {
    // just close the dialog
    onCancel()
  }

  const reset = () => {}

  return (
    <Modal title="Manage Access" opened={opened} onClose={localCancel}>
      <Container>
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localSubmit}>
            Cancel
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={false}
          >
            Save
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
