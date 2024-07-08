import {FileButton, ActionIcon, Tooltip} from "@mantine/core"
import {IconUpload} from "@tabler/icons-react"

export default function UploadButton() {
  const onUpload = () => {}

  return (
    <FileButton onChange={onUpload} multiple>
      {() => (
        <Tooltip label="Upload" withArrow>
          <ActionIcon size="lg" variant="default">
            <IconUpload />
          </ActionIcon>
        </Tooltip>
      )}
    </FileButton>
  )
}
