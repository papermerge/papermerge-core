import {useRenameFolderMutation} from "@/features/nodes/storage/api"
import type {EditEntityTitle} from "@/types"
import type {I18NEditNodeTitleModal} from "kommon"
import {EditNodeTitleModal} from "kommon"
import {ChangeEvent, useEffect, useState} from "react"

import {useTranslation} from "react-i18next"
import {useEnterSubmit} from "./useEnterSubmit"

interface Args {
  node: EditEntityTitle
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export const EditNodeTitleModalContainer = ({
  node,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const txt = useI18nText()
  const [renameFolder, {isLoading}] = useRenameFolderMutation()
  const [title, setTitle] = useState(node.title)
  const [error, setError] = useState("")

  const handleTitleChanged = (event: ChangeEvent<HTMLInputElement>) => {
    let value = event.currentTarget.value
    setTitle(value)
  }

  const onLocalSubmit = async () => {
    const data = {
      title: title,
      id: node.id
    }

    try {
      await renameFolder(data)
      onSubmit()
      reset() // sets error message back to empty string
    } catch (error: any) {
      setError(error?.data?.detail ?? "Something went wrong")
    }
  }

  useEnterSubmit(onLocalSubmit)

  const onLocalCancel = () => {
    onCancel()
    reset()
  }

  const reset = () => {
    setError("")
  }

  return (
    <EditNodeTitleModal
      inProgress={isLoading}
      onCancel={onLocalCancel}
      onSubmit={onLocalSubmit}
      onTitleChange={handleTitleChanged}
      value={title}
      error={error}
      opened={opened}
      txt={txt}
    />
  )
}

function useI18nText(): I18NEditNodeTitleModal | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NEditNodeTitleModal>()

  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        editTitle: t("editNodeTitleModal.title"),
        newTitleLabel: t("editNodeTitleModal.newTitleLabel"),
        placeholder: t("editNodeTitleModal.placeholder"),
        cancel: t("common.cancel"),
        submit: t("common.submit")
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}

export default EditNodeTitleModalContainer
