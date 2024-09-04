import {useState} from "react"
import {Button, Modal, Container, Group, Space, Loader} from "@mantine/core"
import {useDeleteTagMutation} from "@/features/tags/apiSlice"

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
    <Modal title="Delete tags" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete following selected tags?</p>
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
    <Modal title="Delete Groups" opened={opened} onClose={handleCancel}>
      <Container>
        <p>Are you sure you want to delete tag?</p>
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
