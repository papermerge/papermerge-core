import {useDeleteDocumentTypeMutation} from "@/features/document-types/apiSlice"
import {
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Space,
  Text
} from "@mantine/core"
import {useState} from "react"
import {useTranslation} from "react-i18next"

interface RemoveDocumentTypesModalArgs {
  documentTypeIds: string[]
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes document types */
export function RemoveDocumentTypesModal({
  documentTypeIds,
  opened,
  onSubmit,
  onCancel
}: RemoveDocumentTypesModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteDocumentType, {isLoading}] = useDeleteDocumentTypeMutation()

  const handleSubmit = async () => {
    await Promise.all(documentTypeIds.map(i => deleteDocumentType(i)))
    onSubmit()
  }

  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal
      title={t("document_types.delete.many.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("document_types.delete.many.description")}</p>
        <Text size="sm">{t("document_types.delete.hint")}</Text>
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

interface RemoveDocumentTypeModalArgs {
  documentTypeId: string
  onSubmit: () => void
  onCancel: () => void
  opened: boolean
}

/* Removes one specific document Type */
export function RemoveDocumentTypeModal({
  documentTypeId,
  onSubmit,
  onCancel,
  opened
}: RemoveDocumentTypeModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState("")
  const [deleteCustomField, {isLoading}] = useDeleteDocumentTypeMutation()

  const handleSubmit = async () => {
    await deleteCustomField(documentTypeId).unwrap()
    onSubmit()
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }

  return (
    <Modal
      title={t("document_types.delete.one.title")}
      opened={opened}
      onClose={handleCancel}
    >
      <Container>
        <p>{t("document_types.delete.one.description")}</p>
        <Text size="sm">{t("document_types.delete.hint")}</Text>
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
