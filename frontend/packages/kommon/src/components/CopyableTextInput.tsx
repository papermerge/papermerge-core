import {
  ActionIcon,
  CopyButton,
  rem,
  TextInput,
  TextInputProps,
  Tooltip
} from "@mantine/core"
import {IconCheck, IconCopy} from "@tabler/icons-react"

interface CopyableTextInputProps extends Omit<TextInputProps, "rightSection"> {
  value: string
  copyTimeout?: number
  showCopyButton?: boolean
}

export default function CopyableTextInput({
  value,
  copyTimeout = 2000,
  ...textInputProps
}: CopyableTextInputProps) {
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
    <TextInput
      value={value}
      readOnly={true}
      rightSection={copyButton}
      {...textInputProps}
    />
  )
}
