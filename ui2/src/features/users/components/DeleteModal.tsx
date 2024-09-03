import {useState} from "react"
import {Button, Modal, Container, Group, Space, Loader} from "@mantine/core"
import {useDeleteUserMutation} from "@/features/users/apiSlice"

interface RemoveUsersModalArgs {
  opened: boolean
  userIds: string[]
  onSubmit: () => void
  onCancel: () => void
}

/* Removes multiple users */
export function RemoveUsersModal({
  opened,
  userIds,
  onSubmit,
  onCancel
}: RemoveUsersModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedUser, {isLoading}] = useDeleteUserMutation()

  const handleSubmit = async () => {
    await Promise.all(userIds.map(i => deletedUser(i)))
    onSubmit()
    reset()
  }

  const handleCancel = () => {
    onCancel()
    reset()
  }

  const reset = () => {
    setErrorMessage("")
  }

  return (
    <Modal title="Delete Users" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete selected users?</p>
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

interface RemoveUserModalArgs {
  userId: string
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

/* Removes one specific user */
export function RemoveUserModal({
  opened,
  userId,
  onSubmit,
  onCancel
}: RemoveUserModalArgs) {
  const [deletedUser, {isLoading}] = useDeleteUserMutation()
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async () => {
    await deletedUser(userId)
    onSubmit()
    reset()
  }

  const handleCancel = () => {
    onCancel()
    reset()
  }

  const reset = () => {
    setErrorMessage("")
  }

  return (
    <Modal title="Delete User" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete user?</p>
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
