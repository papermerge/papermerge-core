import {useAppSelector} from "@/app/hooks"
import Error from "@/components/Error"
import PanelContext from "@/contexts/PanelContext"
import {useDeleteNodesMutation} from "@/features/nodes/apiSlice"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {Button, Group, Loader, Modal} from "@mantine/core"
import {useContext, useState} from "react"

import type {PanelMode} from "@/types"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  onCancel: () => void
  onSubmit: () => void
  text?: string
}

const TEXT =
  "You are about to delete ALL pages. This is same as deleting entire document. Delete entire document?"

export default function DeleteWithAllPagesSelected({
  opened,
  onCancel,
  onSubmit,
  text = TEXT
}: Args) {
  const {t} = useTranslation()
  const [error, setError] = useState("")
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const [deletedDocumentNode, {isLoading}] = useDeleteNodesMutation()

  const onDeleteDocument = async () => {
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
    <Modal title={t("documents.delete.one")} opened={opened} onClose={onCancel}>
      {text}
      {error && <Error message={error} />}
      <Group justify="space-between" mt="md">
        <Button variant="default" onClick={onCancel}>
          {t("common.yes")}
        </Button>
        <Group>
          {isLoading && <Loader size="sm" />}
          <Button disabled={isLoading} onClick={onDeleteDocument} color={"red"}>
            {t("common.no")}
          </Button>
        </Group>
      </Group>
    </Modal>
  )
}
