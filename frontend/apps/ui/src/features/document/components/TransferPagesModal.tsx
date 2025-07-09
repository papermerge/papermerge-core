import {useMovePagesMutation} from "@/features/document/store/apiSlice"
import {ComboboxItem} from "@mantine/core"
import {useEffect, useState} from "react"

import type {DocumentType} from "@/features/document/types"
import type {ServerErrorType, TransferStrategyType} from "@/types"
import {useTranslation} from "react-i18next"
import {TransferPagesModal, type I18NTransferPagesModal} from "viewer"

interface Args {
  sourceDocID: string
  sourceDocParentID: string
  targetDoc: DocumentType
  sourcePageIDs: string[]
  targetPageID: string
  opened: boolean
  onCancel: () => void
  onSubmit: () => void
}

export default function TransferPagesModalContainer({
  opened,
  onCancel,
  onSubmit,
  sourceDocID,
  sourceDocParentID,
  targetDoc,
  targetPageID,
  sourcePageIDs
}: Args) {
  const txt = useI18nText(targetDoc.title)
  const [value, setValue] = useState<ComboboxItem | null>(null)
  const [error, setError] = useState("")
  const [movePages, {isLoading}] = useMovePagesMutation()

  const onTransferPages = async () => {
    const transferStrategy = (value?.value || "mix") as TransferStrategyType
    const data = {
      body: {
        source_page_ids: sourcePageIDs,
        target_page_id: targetPageID,
        move_strategy: transferStrategy
      },
      sourceDocID: sourceDocID,
      sourceDocParentID: sourceDocParentID,
      targetDocID: targetDoc.id
    }
    try {
      await movePages(data)
      onSubmit()
      reset()
    } catch (e: unknown) {
      const err = e as ServerErrorType
      setError(err.data.detail)
    }
  }

  const reset = () => {
    setError("")
  }

  return (
    <TransferPagesModal
      txt={txt}
      opened={opened}
      value={value}
      inProgress={isLoading}
      onTransfer={onTransferPages}
      error={error}
      onCancel={onCancel}
      onChange={(_value, option) => setValue(option)}
    />
  )
}

function useI18nText(targetTitle: string): I18NTransferPagesModal | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NTransferPagesModal>()

  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        title: t("transferPagesDialog.title"),
        yesTransfer: t("transferPagesDialog.yesTransfer"),
        cancel: t("common.cancel"),
        mixLabel: t("transferPagesDialog.mixLabel"),
        replaceLabel: t("transferPagesDialog.replaceLabel"),
        mainBodyText: t("transferPagesDialog.mainBodyText", {
          targetTitle: targetTitle
        }),
        strategyLabel: t("transferPagesDialog.strategyLabel")
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}
