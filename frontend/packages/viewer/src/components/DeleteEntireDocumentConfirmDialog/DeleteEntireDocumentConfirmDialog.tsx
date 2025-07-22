import {Button, Group, Modal, Text} from "@mantine/core"
import {SubmitButton} from "kommon"
import type {I18NDeleteEntireDocumentConfirmDialog} from "./types"

interface Args {
  opened: boolean
  inProgress: boolean
  txt?: I18NDeleteEntireDocumentConfirmDialog
  error?: string
  onCancel?: () => void
  onSubmit?: () => void
}

const EmptyFunc = () => {}

export default function DeleteEntireDocumentConfirmDialog({
  opened,
  txt,
  error,
  inProgress,
  onCancel,
  onSubmit
}: Args) {
  return (
    <Modal
      title={txt?.title || "Delete Document"}
      opened={opened}
      onClose={onCancel || EmptyFunc}
    >
      {txt?.mainMessage || "Do you really want to delete this document?"}
      {error && <Text c="red">{error}</Text>}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onCancel}>
          {txt?.cancel || "Cancel"}
        </Button>
        <Group>
          <SubmitButton
            inProgress={inProgress}
            onClick={onSubmit}
            color={"red"}
            text={txt?.confirmButtonText || "Yes, delete this document"}
          />
        </Group>
      </Group>
    </Modal>
  )
}
