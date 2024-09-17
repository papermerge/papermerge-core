import {useAppSelector} from "@/app/hooks"
import Error from "@/components/Error"
import PanelContext from "@/contexts/PanelContext"
import {useDeleteNodesMutation} from "@/features/nodes/apiSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {Button, Group, Loader, Modal} from "@mantine/core"
import {useContext, useState} from "react"

import type {PanelMode} from "@/types"

interface Args {
  opened: boolean
  onCancel: () => void
  onSubmit: () => void
}

export default function MovePagesModal({opened, onCancel, onSubmit}: Args) {
  const [error, setError] = useState("")
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const [deletedDocumentNode, {isLoading}] = useDeleteNodesMutation()

  const onMovePages = async () => {
    try {
      await deletedDocumentNode([currentNodeID!])
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
    <Modal title={"Move Selected Pages"} opened={opened} onClose={onCancel}>
      Do you want to move selected pages?
      {error && <Error message={error} />}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onCancel}>
          Cancel
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onMovePages} color={"red"}>
            Move Pages
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
