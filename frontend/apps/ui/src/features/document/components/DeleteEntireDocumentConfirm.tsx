import {useAppSelector} from "@/app/hooks"
import {useDeleteNodesMutation} from "@/features/nodes/storage/api"
import {selectCurrentNodeID} from "@/features/ui/panelRegistry"
import {useEffect, useState} from "react"
import type {I18NDeleteEntireDocumentConfirmDialog} from "viewer"
import {DeleteEntireDocumentConfirmDialog} from "viewer"

import {usePanel} from "@/features/ui/hooks/usePanel"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  onCancel: () => void
  onSubmit: () => void
  text?: string
}

export default function DeleteEntireDocumentConfirmDialogContainer({
  opened,
  onSubmit,
  onCancel
}: Args) {
  const txt = useI18nText()
  const [error, setError] = useState("")
  const {panelId} = usePanel()
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, panelId))
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
    onCancel()
  }

  return (
    <DeleteEntireDocumentConfirmDialog
      txt={txt}
      opened={opened}
      error={error}
      inProgress={isLoading}
      onSubmit={onDeleteDocument}
      onCancel={reset}
    />
  )
}

function useI18nText(): I18NDeleteEntireDocumentConfirmDialog | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NDeleteEntireDocumentConfirmDialog>()

  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        title: t("deleteEntireDocumentConfirmDialog.title"),
        mainMessage: t("deleteEntireDocumentConfirmDialog.mainMessage"),
        cancel: t("common.cancel"),
        confirmButtonText: t(
          "deleteEntireDocumentConfirmDialog.confirmButtonText"
        )
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}
