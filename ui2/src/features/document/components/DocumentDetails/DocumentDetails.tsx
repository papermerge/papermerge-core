import {useAppSelector} from "@/app/hooks"
import {Group, Stack, TextInput} from "@mantine/core"
import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"
import {selectDocumentVersionOCRLang} from "@/features/document/documentVersSlice"
import classes from "./DocumentDetails.module.css"

import {
  selectCurrentNodeID,
  selectDocumentDetailsPanelOpen
} from "@/features/ui/uiSlice"
import type {PanelMode} from "@/types"
import DocumentDetailsToggle from "../DocumentDetailsToggle"

export default function DocumentDetails() {
  const mode: PanelMode = useContext(PanelContext)
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const documentDetailsIsOpen = useAppSelector(s =>
    selectDocumentDetailsPanelOpen(s, mode)
  )
  const ocrLang = useAppSelector(s => selectDocumentVersionOCRLang(s, mode))

  if (!docID || !ocrLang) {
    return <></>
  }

  if (documentDetailsIsOpen) {
    return (
      <Group align="flex-start" className={classes.documentDetailsOpened}>
        <DocumentDetailsToggle />
        <Stack className={classes.documentDetailsContent} justify="flex-start">
          <TextInput label="ID" readOnly value={docID} />
          <TextInput label="OCR Language" readOnly value={ocrLang} mt="md" />
          <TextInput label="Tags" placeholder={"tag1, tag2"} mt="md" />
        </Stack>
      </Group>
    )
  }

  return (
    <Group className={classes.documentDetailsClosed}>
      <DocumentDetailsToggle />
    </Group>
  )
}
