import {
  Button,
  ComboboxItem,
  Group,
  Modal,
  Select,
  Text,
  rem
} from "@mantine/core"
import {SubmitButton} from "kommon"
import type {I18NTransferPagesModal} from "./types"

interface Args {
  txt?: I18NTransferPagesModal
  error?: string
  opened: boolean
  inProgress: boolean
  value: ComboboxItem | null
  onTransfer?: () => void
  onCancel?: () => void
  onChange?: (value: string | null, option: ComboboxItem) => void
}

const EmptyFunc = () => {}

export default function TransferPagesModal({
  txt,
  value,
  inProgress,
  opened,
  onCancel,
  onChange,
  error
}: Args) {
  return (
    <Modal
      title={txt?.title || "Transfer Selected Pages"}
      opened={opened}
      onClose={onCancel || EmptyFunc}
    >
      {txt?.mainBodyText || "Do you want to transfter pages?"}
      <Select
        data={[
          {value: "mix", label: txt?.mixLabel || "Mix"},
          {value: "replace", label: txt?.replaceLabel || "Replace"}
        ]}
        label={txt?.strategyLabel || "Strategy"}
        value={value ? value.value : "mix"}
        onChange={onChange}
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
            text={txt?.yesTransfer || "Yes, transfer"}
          />
        </Group>
      </Group>
    </Modal>
  )
}
