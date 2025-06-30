import {Button, Dialog, Group, Text, Tooltip} from "@mantine/core"

interface I18NPagesHaveChangedDialogText {
  pagesHaveChanged: string
  save: string
  reset: string
  dontBotherMe: string
  saveTooltip: string
  resetTooltip: string
  dontBotherMeTooltip: string
}

interface Args {
  txt?: I18NPagesHaveChangedDialogText
  inProgress: boolean
  opened: boolean
  onSave: () => void
  onReset: () => void
  onClose: () => void
}

export default function PagesHaveChangedDialog({
  opened,
  onClose,
  onSave,
  onReset,
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
          <Button onClick={onSave}>{txt?.save || "Save"}</Button>
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
          <Button onClick={onReset} variant="default">
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
          <Button onClick={onClose} variant="default">
            {txt?.dontBotherMe || `Don't bother me`}
          </Button>
        </Tooltip>
      </Group>
    </Dialog>
  )
}
