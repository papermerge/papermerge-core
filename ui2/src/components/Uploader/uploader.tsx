import {Dialog, List, Container} from "@mantine/core"
import {useSelector, useDispatch} from "react-redux"
import {selectOpened, selectFiles, closeUploader} from "@/slices/uploader"
import UploaderItem from "./uploaderItem"

export default function Uploader() {
  const opened = useSelector(selectOpened)
  const files = useSelector(selectFiles)
  const dispatch = useDispatch()

  const fileItems = files.map(f => (
    <UploaderItem key={`${f.target.id}-${f.file_name}`} fileItem={f} />
  ))

  const onClose = () => {
    dispatch(closeUploader())
  }

  return (
    <Dialog
      opened={opened}
      withBorder
      withCloseButton
      onClose={onClose}
      size="lg"
      radius="md"
    >
      <Container>
        <List size="lg" spacing="xs">
          {fileItems}
        </List>
      </Container>
    </Dialog>
  )
}
