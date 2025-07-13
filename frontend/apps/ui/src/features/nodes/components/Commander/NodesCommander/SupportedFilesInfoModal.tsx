import {Button, Group, Modal, Text} from "@mantine/core"

interface Args {
  opened: boolean
  close: () => void
  supportedExtentions: string[]
}

export default function SupportedFilesInfoModal({
  opened,
  close,
  supportedExtentions
}: Args) {
  return (
    <>
      <Modal
        opened={opened}
        onClose={close}
        size="auto"
        title="Supported Files Info"
      >
        <Text>You can upload PDF, PNG, JPEG, or TIFF files.</Text>
        <Text>Allowed extensions:</Text>
        <Text>{supportedExtentions && supportedExtentions.join(",")}</Text>
        <Text>Uppercase and lowercase letters don't matter.</Text>

        <Group mt="lg" justify="center">
          <Button onClick={close}>Close</Button>
        </Group>
      </Modal>
    </>
  )
}
