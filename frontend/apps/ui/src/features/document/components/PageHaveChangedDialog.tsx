import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {useContext, useState} from "react"

import PanelContext from "@/contexts/PanelContext"
import {
  pagesReseted,
  selectAllPages,
  selectPagesHaveChanged
} from "@/features/document/documentVersSlice"

import {useApplyPageOpChangesMutation} from "@/features/document/apiSlice"
import {selectCurrentDocVerID} from "@/features/ui/uiSlice"
import {PanelMode} from "@/types"
import {PagesHaveChangedDialog} from "viewer"

interface Args {
  docID?: string
}

export default function PagesHaveChangedDialogContainer({docID}: Args) {
  const [dontBotherMe, setDontBotherMe] = useState<boolean>(false)
  const dispatch = useAppDispatch()
  const mode: PanelMode = useContext(PanelContext)
  const docVerID = useAppSelector(s => selectCurrentDocVerID(s, mode))
  const pagesHaveChanged = useAppSelector(s => selectPagesHaveChanged(s, mode))
  const [applyPageOpChanges, {isLoading}] = useApplyPageOpChangesMutation()
  const pages = useAppSelector(s => selectAllPages(s, mode)) || []

  const onSave = async () => {
    const pageData = pages.map(p => {
      const result = {
        angle: p.angle,
        page: {
          number: p.number,
          id: p.id
        }
      }
      return result
    })
    await applyPageOpChanges({pages: pageData, documentID: docID!})
  }

  const onReset = () => {
    dispatch(pagesReseted(docVerID!))
  }

  const onClose = () => {
    setDontBotherMe(true)
  }

  return (
    <PagesHaveChangedDialog
      inProgress={isLoading}
      opened={pagesHaveChanged && !dontBotherMe}
      onClose={onClose}
      onReset={onReset}
      onSave={onSave}
    />
  )
}
