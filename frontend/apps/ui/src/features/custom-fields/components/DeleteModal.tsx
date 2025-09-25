import {useDeleteCustomFieldMutation} from "@/features/custom-fields/storage/api"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

interface RemoveCustomFieldsModalArgs {
  customFieldIds: string[]
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes multiple custom fields */
export function RemoveCustomFieldsModal({
  customFieldIds,
  opened,
  onSubmit,
  onCancel
}: RemoveCustomFieldsModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteCustomField, {isLoading}] = useDeleteCustomFieldMutation()

  const handleSubmit = async () => {
    await Promise.all(customFieldIds.map(i => deleteCustomField(i)))
    onSubmit()
  }

  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal
      title={t("custom_fields.delete.many.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("custom_fields.delete.many.description")}</p>
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

interface RemoveCustomFieldModalArgs {
  customFieldId: string
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes one specific custom field */
export function RemoveCustomFieldModal({
  customFieldId,
  onSubmit,
  onCancel,
  opened
}: RemoveCustomFieldModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteCustomField, {isLoading}] = useDeleteCustomFieldMutation()

  const handleSubmit = async () => {
    await deleteCustomField(customFieldId).unwrap()
    onSubmit()
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal
      title={t("custom_fields.delete.one.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("custom_fields.delete.one.description")}</p>
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
