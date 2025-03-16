import {useDeleteRoleMutation} from "@/features/roles/apiSlice"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"
import {useState} from "react"

interface RemoveRolesModalArgs {
  roleIds: string[]
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes multiple roles */
export function RemoveRolesModal({
  roleIds,
  opened,
  onSubmit,
  onCancel
}: RemoveRolesModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedRole, {isLoading}] = useDeleteRoleMutation()

  const handleSubmit = async () => {
    await Promise.all(roleIds.map(i => deletedRole(i)))
    onSubmit()
  }

  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal title="Delete Roles" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete selected roles?</p>
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

interface RemoveRoleModalArgs {
  roleId: string
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes one specific role */
export function RemoveRoleModal({
  roleId,
  onSubmit,
  onCancel,
  opened
}: RemoveRoleModalArgs) {
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedRole, {isLoading}] = useDeleteRoleMutation()

  const handleSubmit = async () => {
    await deletedRole(roleId).unwrap()
    onSubmit()
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal title="Delete Role" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete this role?</p>
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
