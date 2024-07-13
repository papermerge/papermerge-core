import {FileButton, ActionIcon, Tooltip} from "@mantine/core"
import {IconUpload} from "@tabler/icons-react"

export default function UploadButton() {
  const onUpload = (files: File[]) => {
    if (!files) {
      console.error("Empty array for uploaded files")
      return
    }
  }

  return (
    <FileButton
      onChange={onUpload}
      accept="image/png,image/jpeg,application/pdf"
      multiple
    >
      {props => (
        <Tooltip label="Upload" withArrow>
          <ActionIcon {...props} size="lg" variant="default">
            <IconUpload stroke={1.4} />
          </ActionIcon>
        </Tooltip>
      )}
    </FileButton>
  )
}
