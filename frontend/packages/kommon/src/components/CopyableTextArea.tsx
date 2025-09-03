import {
  ActionIcon,
  CopyButton,
  rem,
  Textarea,
  TextareaProps,
  Tooltip
} from "@mantine/core"
import {IconCheck, IconCopy} from "@tabler/icons-react"

interface CopyableTextareaProps extends Omit<TextareaProps, "rightSection"> {
  value: string
  copyTimeout?: number
}

export default function CopyableTextarea({
  value,
  copyTimeout = 2000,
  ...textareaProps
}: CopyableTextareaProps) {
  const copyButton = value ? (
    <CopyButton value={value} timeout={copyTimeout}>
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
  ) : null

  return (
    <Textarea
      value={value}
      readOnly={true}
      rightSection={copyButton}
      {...textareaProps}
    />
  )
}
