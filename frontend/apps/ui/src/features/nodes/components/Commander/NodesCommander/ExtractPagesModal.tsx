import {useAppDispatch} from "@/app/hooks"
import {extractPages} from "@/features/document/actions/extractPages"
import {useGetDocumentQuery} from "@/features/document/store/apiSlice"
import {usePanelMode} from "@/hooks"
import type {
  ClientPage,
  ExtractStrategyType,
  FolderType,
  ServerErrorType
} from "@/types"
import {drop_extension} from "@/utils"
import {useEffect, useState} from "react"
import {useTranslation} from "react-i18next"
import {useNavigate} from "react-router"
import {ExtractPagesModal, type I18NExtractPagesModal} from "viewer"

type ExtractPagesModalArgs = {
  sourcePages: ClientPage[]
  sourceDocID: string
  sourceDocParentID: string
  targetFolder: FolderType
  opened: boolean
  onSubmit: () => void
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
  const dispatch = useAppDispatch()
  const navigate = useNavigate()
  const mode = usePanelMode()
  const {currentData: doc} = useGetDocumentQuery(sourceDocID)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [titleFormat, setTitleFormat] = useState<string>("")
  const [separateDocs, setSeparateDocs] = useState<boolean>(false)
  const [inProgress, setInProgress] = useState<boolean>(false)
  const txt = useI18nText(targetFolder.title, titleFormat)

  useEffect(() => {
    if (doc?.title) {
      setTitleFormat(drop_extension(doc.title))
    }
  }, [doc?.title])

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
      await dispatch(
        extractPages({extractPagesData: data, sourceMode: mode, navigate})
      )
      onSubmit()
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
      onCheckboxExtractIntoSeparateDocChange={event =>
        setSeparateDocs(event.currentTarget.checked)
      }
      onTitleFormatChange={event => setTitleFormat(event.currentTarget.value)}
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
  titleFormat: string
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
          targetFolderTitle: targetFolderTitle
        }),
        titleFormatLabel: t("extractPagesDialog.titleFormatLabel"),
        titleFormatDescription: t("extractPagesDialog.titleFormatDescription", {
          docBaseTitle: titleFormat
        }),
        checkboxExtractIntoSeparateDocLabel: t(
          "extractPagesDialog.checkboxExtractIntoSeparateDocLabel"
        )
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t, titleFormat])

  return txt
}
