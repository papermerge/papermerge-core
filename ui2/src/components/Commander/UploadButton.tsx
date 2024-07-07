import {ActionIcon, FileButton} from "@mantine/core"
import {IconUpload} from "@tabler/icons-react"

export default function UploadButton() {
  const onUpload = () => {}

  return (
    <FileButton onChange={onUpload} multiple>
      {props => (
        <ActionIcon {...props} size="lg" variant="default">
          <IconUpload size={18} />
        </ActionIcon>
      )}
    </FileButton>
  )
}
