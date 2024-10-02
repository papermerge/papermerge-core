import {useDeleteDocumentTypeMutation} from "@/features/document-types/apiSlice"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"
import {useState} from "react"

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
    <Modal title="Delete Custom Fields" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete selected document types?</p>
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
    <Modal title="Delete Custom Field" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete this document type?</p>
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
