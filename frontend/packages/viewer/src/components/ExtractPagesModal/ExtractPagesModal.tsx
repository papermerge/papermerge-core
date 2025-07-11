import {
  Button,
  Checkbox,
  Container,
  Group,
  Modal,
  Space,
  Text,
  TextInput
} from "@mantine/core"
import {SubmitButton} from "kommon"
import type {I18NExtractPagesModal} from "./types"

interface Args {
  txt?: I18NExtractPagesModal
  error?: string
  opened: boolean
  inProgress: boolean
  separateDocs: boolean
  titleFormat: string
  titleFormatDescription: string
  onExtract?: () => void
  onCancel?: () => void
  onTitleFormatChange?: (value: React.ChangeEvent<HTMLInputElement>) => void
  onCheckboxExtractIntoSeparateDocChange?: (
    event: React.ChangeEvent<HTMLInputElement>
  ) => void
}

const EmptyFunc = () => {}

export default function TransferPagesModal({
  txt,
  inProgress,
  opened,
  separateDocs,
  onCancel,
  titleFormat,
  titleFormatDescription,
  onCheckboxExtractIntoSeparateDocChange,
  onTitleFormatChange,
  onExtract,
  error
}: Args) {
  return (
    <Modal
      title={txt?.title || "Extract Pages"}
      opened={opened}
      size="lg"
      onClose={onCancel || EmptyFunc}
    >
      <Container>
        <Text>
          {txt?.mainBodyText || "Do you want to extract selected pages"}
        </Text>
        <TextInput
          my="md"
          label={txt?.titleFormatLabel || "Title Format"}
          rightSectionPointerEvents="none"
          description={titleFormatDescription}
          rightSection={".pdf"}
          value={titleFormat}
          onChange={onTitleFormatChange}
        />
        <Checkbox
          label={
            txt?.checkboxExtractIntoSeparateDocLabel ||
            "Extract each page into separate document"
          }
          my="md"
          checked={separateDocs}
          onChange={onCheckboxExtractIntoSeparateDocChange}
        />
        {error}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={onCancel}>
            {txt?.cancel || "Cancel"}
          </Button>
          <SubmitButton
            onClick={onExtract}
            inProgress={inProgress}
            text={txt?.yesExtract || "Yes, extract"}
          />
        </Group>
      </Container>
    </Modal>
  )
}
