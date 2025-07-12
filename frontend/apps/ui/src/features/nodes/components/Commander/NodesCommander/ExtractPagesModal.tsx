import {useEffect, useState} from "react"

import {
  useExtractPagesMutation,
  useGetDocumentQuery
} from "@/features/document/store/apiSlice"
import type {
  ClientPage,
  ExtractPagesResponse,
  ExtractStrategyType,
  FolderType,
  ServerErrorType
} from "@/types"
import {drop_extension} from "@/utils"
import {useTranslation} from "react-i18next"
import {ExtractPagesModal, type I18NExtractPagesModal} from "viewer"

type ExtractPagesModalArgs = {
  sourcePages: ClientPage[]
  sourceDocID: string
  sourceDocParentID: string
  targetFolder: FolderType
  opened: boolean
  onSubmit: (resp?: ExtractPagesResponse) => void
  onCancel: () => void
}

export default function ExtractPagesModalContainer({
  sourcePages,
  sourceDocID,
  sourceDocParentID,
  targetFolder,
  opened,
  onSubmit,
  onCancel
}: ExtractPagesModalArgs) {
  const {t} = useTranslation()
  const [extractPages, {isLoading}] = useExtractPagesMutation()
  const {currentData: doc} = useGetDocumentQuery(sourceDocID)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [titleFormat, setTitleFormat] = useState<string>("")
  const [separateDocs, setSeparateDocs] = useState<boolean>(false)
  const [titleFormatDescription, setTitleFormatDescription] =
    useState<string>("")
  const [inProgress, setInProgress] = useState<boolean>(false)
  const txt = useI18nText(doc?.title || "", titleFormatDescription)

  useEffect(() => {
    if (doc?.title) {
      setTitleFormat(drop_extension(doc.title))
      setTitleFormatDescription(
        `Extracted pages will be placed in document(s) with name ${titleFormat}-[ID].pdf`
      )
    }
  }, [doc?.title])

  useEffect(() => {
    if (titleFormat) {
      setTitleFormatDescription(
        `Extracted pages will be placed in document(s) with title ${titleFormat}-[ID].pdf`
      )
    }
  }, [titleFormat])

  const onExtractPages = async () => {
    const multiple_docs: ExtractStrategyType = "one-page-per-doc"
    const one_doc: ExtractStrategyType = "all-pages-in-one-doc"
    const data = {
      body: {
        source_page_ids: sourcePages.map(p => p.id),
        target_folder_id: targetFolder.id,
        strategy: separateDocs ? multiple_docs : one_doc,
        title_format: titleFormat
      },
      sourceDocID: sourceDocID,
      sourceDocParentID: sourceDocParentID
    }
    try {
      setInProgress(true)
      const resp = await extractPages(data)
      onSubmit(resp.data)
      setInProgress(false)
    } catch (e: unknown) {
      const err = e as ServerErrorType
      setErrorMessage(err.data.detail)
      setInProgress(false)
    }
  }
  const localCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <ExtractPagesModal
      opened={opened}
      separateDocs={separateDocs}
      inProgress={inProgress}
      titleFormat={titleFormat}
      txt={txt}
      onCancel={localCancel}
      onExtract={onExtractPages}
      error={errorMessage}
    />
  )
}

function useI18nText(
  targetFolderTitle: string,
  pagesTitleFormat: string
): I18NExtractPagesModal | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NExtractPagesModal>()

  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        title: t("extractPagesDialog.title"),
        yesExtract: t("extractPagesDialog.yesTransfer"),
        cancel: t("common.cancel"),
        mainBodyText: t("extractPagesDialog.mainBodyText", {
          targetTitle: targetFolderTitle
        }),
        titleFormatLabel: t("extractPagesDialog.titleFormatLabel"),
        checkboxExtractIntoSeparateDocLabel: t(
          "extractPagesDialog.checkboxExtractIntoSeparateDocLabel"
        ),
        titleFormatDescription: t("extractPagesDialog.titleFormatDescription", {
          titleFormat: pagesTitleFormat
        })
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}
