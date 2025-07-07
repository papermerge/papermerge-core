import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useContext, useEffect, useState} from "react"
import {useTranslation} from "react-i18next"

import PanelContext from "@/contexts/PanelContext"
import {
  pagesReseted,
  selectAllPages,
  selectPagesHaveChanged
} from "@/features/document/store/documentVersSlice"

import {
  selectCurrentDocVerID,
  selectViewerPagesHaveChangedDialogVisibility,
  viewerPageHaveChangedDialogVisibilityChanged
} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import type {I18NPagesHaveChangedDialogText} from "viewer"
import {PagesHaveChangedDialog} from "viewer"
import {applyPageChangesThunk} from "../actions/applyPageOpChanges"

interface Args {
  docID: string
}

export default function PagesHaveChangedDialogContainer({docID}: Args) {
  const [inProgress, setInProgress] = useState<boolean>(false)
  const txt = useI18nText()
  const [dontBotherMe, setDontBotherMe] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const pagesHaveChanged = useAppSelector(s => selectPagesHaveChanged(s, mode))
  const pages = useAppSelector(s => selectAllPages(s, mode)) || []
  const visibility = useAppSelector(
    selectViewerPagesHaveChangedDialogVisibility
  )
  const showDialog = visibility == "opened"

  useEffect(() => {
    /* Dialog may be part of two panels as two side by side viewers can be
    opened. To avoid displaying dialog twice, which happens
    when SAME document is displayed in two panels, this dialog visibility state
    is stored in UI slice. Dialog state (opened/closed) is independent of the panel */
    const newVisibility = pagesHaveChanged ? "opened" : "closed"
    dispatch(
      viewerPageHaveChangedDialogVisibilityChanged({visibility: newVisibility})
    )
  }, [pagesHaveChanged])

  const onSave = async () => {
    setInProgress(true)
    await dispatch(applyPageChangesThunk({docID: docID, pages, mode}))
    setInProgress(false)
  }

  const onReset = () => {
    dispatch(pagesReseted(docVerID!))
  }

  const onClose = () => {
    setDontBotherMe(true)
  }

  return (
    <PagesHaveChangedDialog
      inProgress={inProgress}
      opened={showDialog && !dontBotherMe}
      onClose={onClose}
      onReset={onReset}
      onSave={onSave}
      txt={txt}
    />
  )
}

function useI18nText(): I18NPagesHaveChangedDialogText | undefined {
  const {t, i18n} = useTranslation()
  const [txt, setTxt] = useState<I18NPagesHaveChangedDialogText>()

  useEffect(() => {
    if (i18n.isInitialized) {
      setTxt({
        pagesHaveChanged: t("pagesHaveChanged.mainText"),
        save: t("common.save"),
        reset: t("common.reset"),
        saveTooltip: t("pagesHaveChanged.saveTooltip"),
        resetTooltip: t("pagesHaveChanged.resetTooltip"),
        dontBotherMe: t("pagesHaveChanged.dontBotherMe"),
        dontBotherMeTooltip: t("pagesHaveChanged.dontBotherMeTooltip")
      })
    } else {
      setTxt(undefined)
    }
  }, [i18n.isInitialized, t])

  return txt
}
