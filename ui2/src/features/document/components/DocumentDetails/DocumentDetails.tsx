import {useAppSelector} from "@/app/hooks"
import {Stack} from "@mantine/core"
import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"

import {
  selectCurrentNodeID,
  selectDocumentDetailsPanelOpen
} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"

export default function DocumentDetails() {
  const mode: PanelMode = useContext(PanelContext)
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const documentDetailsIsOpen = useAppSelector(s =>
    selectDocumentDetailsPanelOpen(s, mode)
  )

  if (documentDetailsIsOpen) {
    return <Stack justify="flex-start">{docID}</Stack>
  }

  return <Stack style={{display: "none"}} justify="flex-start"></Stack>
}
