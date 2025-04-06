import {useGetSharedNodeAccessDetailsQuery} from "@/features/shared_nodes/apiSlice"
import {Button, Container, Group, Loader, Modal} from "@mantine/core"
import ManageAccessGroups from "./ManageAccessGroups"
import ManageAccessUsers from "./ManageAccessUsers"

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
  const {isLoading} = useGetSharedNodeAccessDetailsQuery(node_id)

  const localSubmit = async () => {
    onSubmit()
  }

  const localCancel = () => {
    // just close the dialog
    onCancel()
  }

  const reset = () => {}

  if (isLoading) {
    return (
      <Modal title="Manage Access" opened={opened} onClose={localCancel}>
        <Container>
          <Loader />
          <Group gap="lg" justify="space-between">
            <Button variant="default" onClick={localCancel}>
              Cancel
            </Button>
            <Button disabled={true}>Save</Button>
          </Group>
        </Container>
      </Modal>
    )
  }

  return (
    <Modal title="Manage Access" opened={opened} onClose={localCancel}>
      <Container>
        <ManageAccessUsers node_id={node_id} />
        <ManageAccessGroups node_id={node_id} />
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
