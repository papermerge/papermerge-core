import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useContext, useState} from "react"

import PanelContext from "@/contexts/PanelContext"
import {
  pagesReseted,
  selectAllPages,
  selectPagesHaveChanged
} from "@/features/document/documentVersSlice"

import {selectCurrentDocVerID} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import {PagesHaveChangedDialog} from "viewer"
import {applyPageChangesThunk} from "../actions/applyPageOpChanges"

interface Args {
  docID: string
}

export default function PagesHaveChangedDialogContainer({docID}: Args) {
  const [inProgress, setInProgress] = useState<boolean>(false)
  const [dontBotherMe, setDontBotherMe] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const pagesHaveChanged = useAppSelector(s => selectPagesHaveChanged(s, mode))

  const pages = useAppSelector(s => selectAllPages(s, mode)) || []

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
      opened={pagesHaveChanged && !dontBotherMe}
      onClose={onClose}
      onReset={onReset}
      onSave={onSave}
    />
  )
}
