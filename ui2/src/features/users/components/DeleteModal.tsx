import {useState} from "react"
import {Button, Modal, Container, Group, Space, Loader} from "@mantine/core"
import {useDeleteUserMutation} from "@/features/users/apiSlice"
import {useTranslation} from "react-i18next"

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
  const {t} = useTranslation()
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
    <Modal
      title={t("users.delete.many.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("users.delete.many.description")}</p>
        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={handleSubmit}
            disabled={isLoading}
            color={"red"}
          >
            {t("common.delete")}
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
  const {t} = useTranslation()
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
    <Modal
      title={t("users.delete.one.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("users.delete.one.description")}</p>
        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={handleCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={handleSubmit}
            disabled={isLoading}
            color={"red"}
          >
            {t("common.delete")}
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
