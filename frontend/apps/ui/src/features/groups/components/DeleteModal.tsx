import {useState} from "react"
import {Button, Modal, Container, Group, Space, Loader} from "@mantine/core"
import {useDeleteGroupMutation} from "@/features/groups/apiSlice"
import {useTranslation} from "react-i18next"

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
  const {t} = useTranslation()
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
    <Modal
      title={t("groups.delete.many.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("groups.delete.many.title")}</p>
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
  const {t} = useTranslation()
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
    <Modal
      title={t("groups.delete.one.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("groups.delete.one.description")}</p>
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
