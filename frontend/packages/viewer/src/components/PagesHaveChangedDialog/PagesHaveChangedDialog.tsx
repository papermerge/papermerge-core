import {Button, Dialog, Group, Text, Tooltip} from "@mantine/core"
import {SubmitButton} from "kommon"
import type {I18NPagesHaveChangedDialogText} from "./types"

interface Args {
  txt?: I18NPagesHaveChangedDialogText
  inProgress: boolean
  opened: boolean
  onSave?: () => void
  onReset?: () => void
  onClose?: () => void
}

export default function PagesHaveChangedDialog({
  opened,
  onClose,
  onSave,
  onReset,
  inProgress,
  txt
}: Args) {
  return (
    <Dialog
      opened={opened}
      withCloseButton
      onClose={onClose}
      size="lg"
      radius="md"
    >
      <Text size="sm" my="md">
        {txt?.pagesHaveChanged ||
          `There are changes, like page order or rotation, which are not yet saved
           on the server. What would you like to do?`}
      </Text>

      <Group align="flex-end">
        <Tooltip
          multiline
          w={220}
          withArrow
          openDelay={1000}
          label={
            txt?.saveTooltip ||
            `Apply changes to the server. Once applied, document version
            will increase by one`
          }
        >
          <SubmitButton
            inProgress={inProgress}
            onClick={onSave}
            text={txt?.save || "Save"}
          />
        </Tooltip>
        <Tooltip
          openDelay={1000}
          multiline
          w={220}
          withArrow
          label={
            txt?.resetTooltip ||
            `Discard changes. This will bring pages in their initial state (same as on server)`
          }
        >
          <Button disabled={inProgress} onClick={onReset} variant="default">
            {txt?.reset || "Reset"}
          </Button>
        </Tooltip>
        <Tooltip
          openDelay={1000}
          multiline
          w={220}
          withArrow
          label={
            txt?.dontBotherMeTooltip ||
            `Close this dialog. You can apply changes later from the context menu`
          }
        >
          <Button disabled={inProgress} onClick={onClose} variant="default">
            {txt?.dontBotherMe || `Don't bother me`}
          </Button>
        </Tooltip>
      </Group>
    </Dialog>
  )
}
