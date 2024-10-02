import {useDeleteCustomFieldMutation} from "@/features/custom-fields/apiSlice"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"
import {useState} from "react"

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
    <Modal title="Delete Custom Fields" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete selected custom fields?</p>
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
    <Modal title="Delete Custom Field" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete this custom field?</p>
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
