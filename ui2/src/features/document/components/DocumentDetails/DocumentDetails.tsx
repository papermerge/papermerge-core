import {useAppSelector} from "@/app/hooks"
import {Group, Stack, TextInput} from "@mantine/core"
import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"
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

  if (documentDetailsIsOpen) {
    return (
      <Group align="flex-start" className={classes.documentDetailsOpened}>
        <DocumentDetailsToggle />
        <Stack className={classes.documentDetailsContent} justify="flex-start">
          <TextInput label="ID" value={docID} />
          <TextInput label="Email" placeholder="Email" mt="md" />
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
