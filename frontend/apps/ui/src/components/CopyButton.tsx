import {CopyButton, ActionIcon, Tooltip, rem} from "@mantine/core"
import {IconCopy, IconCheck} from "@tabler/icons-react"

type Args = {
  value: string
  timeout?: number
}

export default function CustomCopyButton({value, timeout}: Args) {
  if (!timeout) {
    timeout = 2000
  }
  return (
    <CopyButton value={value} timeout={timeout}>
      {({copied, copy}) => (
        <Tooltip label={copied ? "Copied" : "Copy"} withArrow position="right">
          <ActionIcon
            color={copied ? "teal" : "gray"}
            variant="subtle"
            onClick={copy}
          >
            {copied ? (
              <IconCheck style={{width: rem(16)}} />
            ) : (
              <IconCopy style={{width: rem(16)}} />
            )}
          </ActionIcon>
        </Tooltip>
      )}
    </CopyButton>
  )
}
