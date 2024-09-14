import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {Button, Dialog, Group, Text, Tooltip} from "@mantine/core"
import {useContext, useState} from "react"

import PanelContext from "@/contexts/PanelContext"
import {
  pagesReseted,
  selectAllPages,
  selectPagesHaveChanged
} from "@/features/document/documentVersSlice"

import {selectCurrentNodeID} from "@/features/ui/uiSlice"

import {useApplyPageOpChangesMutation} from "@/features/document/apiSlice"
import {selectCurrentDocVerID} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"

export default function PagesHaveChangedDialog() {
  const [dontBotherMe, setDontBotherMe] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const pagesHaveChanged = useAppSelector(s => selectPagesHaveChanged(s, mode))
  const [applyPageOpChanges] = useApplyPageOpChangesMutation()
  const pages = useAppSelector(s => selectAllPages(s, mode)) || []

  const onSave = async () => {
    const pageData = pages.map(p => {
      const result = {
        angle: p.angle,
        page: {
          number: p.number,
          id: p.id
        }
      }
      return result
    })
    await applyPageOpChanges({pages: pageData, documentID: docID!})
  }

  const onReset = () => {
    dispatch(pagesReseted(docVerID!))
  }

  const onClose = () => {
    setDontBotherMe(true)
  }

  return (
    <Dialog
      opened={pagesHaveChanged && !dontBotherMe}
      withCloseButton
      onClose={onClose}
      size="lg"
      radius="md"
    >
      <Text size="sm" my="md">
        There are changes, like page order or rotation, which are not yet saved
        on the server. What would you like to do?
      </Text>

      <Group align="flex-end">
        <Tooltip
          multiline
          w={220}
          withArrow
          openDelay={1000}
          label="Apply changes to the server. Once applied, document version
        will increase by one"
        >
          <Button onClick={onSave}>Save</Button>
        </Tooltip>
        <Tooltip
          openDelay={1000}
          multiline
          w={220}
          withArrow
          label="Discard changes. This will bring pages in their initial state (same as on server)"
        >
          <Button onClick={onReset} variant="default">
            Reset
          </Button>
        </Tooltip>
        <Tooltip
          openDelay={1000}
          multiline
          w={220}
          withArrow
          label="Close this dialog. You can apply changes later from the context menu"
        >
          <Button onClick={onClose} variant="default">
            Don't bother me
          </Button>
        </Tooltip>
      </Group>
    </Dialog>
  )
}
