import {Dialog, Group, Button, TextInput, Text} from "@mantine/core"
import {useSelector, useDispatch} from "react-redux"
import {selectOpened, closeUploader} from "@/slices/uploader"

export default function Uploader() {
  const opened = useSelector(selectOpened)
  const dispatch = useDispatch()

  const onClose = () => {
    dispatch(closeUploader())
  }

  return (
    <Dialog
      opened={opened}
      withCloseButton
      onClose={onClose}
      size="lg"
      radius="md"
    >
      <Text size="sm" mb="xs" fw={500}>
        Subscribe to email newsletter
      </Text>

      <Group align="flex-end">
        <TextInput placeholder="hello@gluesticker.com" style={{flex: 1}} />
        <Button onClick={close}>Subscribe</Button>
      </Group>
    </Dialog>
  )
}
