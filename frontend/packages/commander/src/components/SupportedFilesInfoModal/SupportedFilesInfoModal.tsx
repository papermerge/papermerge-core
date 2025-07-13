import {Button, Group, List, Modal, Text} from "@mantine/core"
import type {I18NSupportedFilesInfoModal} from "./types"

interface Args {
  opened: boolean
  onClose: () => void
  supportedExtentions: string[]
  txt?: I18NSupportedFilesInfoModal
}

export default function SupportedFilesInfoModal({
  opened,
  onClose,
  supportedExtentions,
  txt
}: Args) {
  const extList = supportedExtentions.map(ext => (
    <List.Item key={ext}>{ext}</List.Item>
  ))
  return (
    <>
      <Modal
        opened={opened}
        onClose={onClose}
        size="auto"
        title={txt?.title || "Supported Files Info"}
      >
        <Text>
          {txt?.supportedFiles ||
            "You can upload PDF, PNG, JPEG, or TIFF files."}
        </Text>
        <Text>{txt?.allowedExtentions || "Allowed extensions:"}</Text>
        {supportedExtentions && <List m="md">{extList}</List>}
        <Text>
          {txt?.caseSensitivity ||
            "Uppercase and lowercase letters don't matter."}
        </Text>

        <Group mt="lg" justify="center">
          <Button onClick={onClose}>{txt?.close || "Close"}</Button>
        </Group>
      </Modal>
    </>
  )
}
