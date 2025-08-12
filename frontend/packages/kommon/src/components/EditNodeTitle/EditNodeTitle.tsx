import {Button, Group, Modal, Text, TextInput, rem} from "@mantine/core"
import {SubmitButton} from "kommon"
import type {I18NEditNodeTitleModal} from "./types"

const EmptyFunc = () => {}

interface Args {
  txt?: I18NEditNodeTitleModal
  opened: boolean
  value: string
  inProgress: boolean
  error?: string
  onTitleChange?: (value: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit?: () => void
  onCancel?: () => void
}

export default function EditNodeTitleModal({
  txt,
  value,
  error,
  opened,
  onTitleChange,
  onSubmit,
  onCancel,
  inProgress
}: Args) {
  return (
    <Modal
      title={txt?.editTitle || "Edit Title"}
      opened={opened}
      onClose={onCancel || EmptyFunc}
    >
      <TextInput
        data-autofocus
        onChange={onTitleChange}
        value={value}
        label={txt?.newTitleLabel || "New Title"}
        placeholder={txt?.placeholder || "Title"}
        mt="md"
      />
      {error && (
        <Text mt={rem(4)} c="red">
          {error}
        </Text>
      )}

      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onCancel}>
          {txt?.cancel || "Cancel"}
        </Button>
        <Group>
          <SubmitButton
            inProgress={inProgress}
            onClick={onSubmit}
            text={txt?.submit || "Submit"}
          />
        </Group>
      </Group>
    </Modal>
  )
}
