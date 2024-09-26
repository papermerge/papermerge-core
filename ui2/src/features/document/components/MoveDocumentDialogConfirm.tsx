import {useAppSelector} from "@/app/hooks"
import Error from "@/components/Error"
import PanelContext from "@/contexts/PanelContext"
import {useMoveNodesMutation} from "@/features/nodes/apiSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {Button, Group, Loader, Modal} from "@mantine/core"
import {useContext, useState} from "react"

import type {PanelMode} from "@/types"

interface Args {
  opened: boolean
  onCancel: () => void
  onSubmit: () => void
  text?: string
}

export default function MoveDocumentDialogConfirm({
  opened,
  onCancel,
  onSubmit
}: Args) {
  /* Modal dialog to confirm the moving of the document to
    the current folder of the other panel.

   This dialog is opened from the viewer.
   When dialog is opened other panel is assumed be opened and to be commander.
    */
  const [error, setError] = useState("")
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const [moveNode, {isLoading}] = useMoveNodesMutation()

  const onMoveDocument = async () => {
    const data = {
      body: {
        source_ids: [],
        target_id: "111"
      },
      sourceFolderID: "12"
    }
    try {
      await moveNode(data)
      onSubmit()
      reset()
    } catch (error: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
  }

  const reset = () => {
    setError("")
  }

  return (
    <Modal title={"Move Document"} opened={opened} onClose={onCancel}>
      Move?
      {error && <Error message={error} />}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onCancel}>
          No
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onMoveDocument}>
            Yes
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
