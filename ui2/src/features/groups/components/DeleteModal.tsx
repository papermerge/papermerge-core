import {useState} from "react"
import {Button, Modal, Container, Group, Space, Loader} from "@mantine/core"
import {useDeleteGroupMutation} from "@/features/groups/apiSlice"

interface RemoveGroupsModalArgs {
  groupIds: string[]
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes multiple groups */
export function RemoveGroupsModal({
  groupIds,
  opened,
  onSubmit,
  onCancel
}: RemoveGroupsModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedGroup, {isLoading}] = useDeleteGroupMutation()

  const handleSubmit = async () => {
    await Promise.all(groupIds.map(i => deletedGroup(i)))
    onSubmit()
  }

  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal title="Delete Groups" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete selected groups?</p>
        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={handleSubmit}
            disabled={isLoading}
            color={"red"}
          >
            Delete
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}

interface RemoveGroupModalArgs {
  groupId: string
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes one specific group */
export function RemoveGroupModal({
  groupId,
  onSubmit,
  onCancel,
  opened
}: RemoveGroupModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedGroup, {isLoading}] = useDeleteGroupMutation()

  const handleSubmit = async () => {
    await deletedGroup(groupId).unwrap()
    onSubmit()
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal title="Delete Group" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete this group?</p>
        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={handleSubmit}
            disabled={isLoading}
            color={"red"}
          >
            Delete
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
