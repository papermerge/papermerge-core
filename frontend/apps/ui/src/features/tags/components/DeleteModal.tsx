import {useDeleteTagMutation} from "@/features/tags/storage/api"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

type RemoveTagsModalArgs = {
  tagIds: string[]
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes multiple tags */
export function DeleteTagsModal({
  tagIds,
  onSubmit,
  onCancel,
  opened
}: RemoveTagsModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState("")
  const [deletedTag, {isLoading}] = useDeleteTagMutation()

  const handleSubmit = async () => {
    await Promise.all(tagIds.map(i => deletedTag(i)))
    onSubmit()
    return true
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal
      title={t("tags.delete.many.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("tags.delete.many.description")}</p>
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

interface DeleteTagModalArgs {
  tagId: string
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

/* Removes one specific user */
export function DeleteTagModal({
  tagId,
  onSubmit,
  onCancel,
  opened
}: DeleteTagModalArgs) {
  const {t} = useTranslation()
  const [deletedTag, {isLoading}] = useDeleteTagMutation()
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async () => {
    await deletedTag(tagId).unwrap()
    onSubmit()
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal
      title={t("tags.delete.one.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("tags.delete.one.description")}</p>
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
