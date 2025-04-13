import {useAppSelector} from "@/app/hooks"
import {
  ActionIcon,
  Group,
  Skeleton,
  Stack,
  TagsInput,
  TextInput
} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {useContext} from "react"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {
  selectDocumentVersionID,
  selectDocumentVersionOCRLang
} from "@/features/document/documentVersSlice"
import {useGetGroupQuery} from "@/features/groups/apiSlice"
import {skipToken} from "@reduxjs/toolkit/query"
import {IconEdit} from "@tabler/icons-react"
import classes from "./DocumentDetails.module.css"

import {OWNER_ME} from "@/cconstants"
import CopyButton from "@/components/CopyButton"
import {EditNodeTagsModal} from "@/components/EditNodeTags"
import {
  selectCurrentNodeID,
  selectDocumentDetailsPanelOpen
} from "@/features/ui/uiSlice"
import type {DocumentType, PanelMode} from "@/types"
import DocumentDetailsToggle from "../DocumentDetailsToggle"
import CustomFields from "./CustomFields"

interface Args {
  doc?: DocumentType
  docID?: string
  isLoading: boolean
}

export default function DocumentDetails({doc, docID, isLoading}: Args) {
  const mode: PanelMode = useContext(PanelContext)
  const {currentData: groupData, isLoading: groupDataIsLoading} =
    useGetGroupQuery(doc?.group_id ?? skipToken)
  const documentDetailsIsOpen = useAppSelector(s =>
    selectDocumentDetailsPanelOpen(s, mode)
  )
  const ocrLang = useAppSelector(s => selectDocumentVersionOCRLang(s, mode))
  const docVerID = useAppSelector(s => selectDocumentVersionID(s, mode))

  if (!ocrLang || !docID || isLoading || groupDataIsLoading) {
    return (
      <Group align="flex-start" className={classes.documentDetailsOpened}>
        <DocumentDetailsToggle />
        <Stack className={classes.documentDetailsContent} justify="flex-start">
          <Skeleton height={"20"} />
          <Skeleton height={"20"} />
          <Skeleton height={"20"} />
        </Stack>
      </Group>
    )
  }

  if (documentDetailsIsOpen) {
    return (
      <Group align="flex-start" className={classes.documentDetailsOpened}>
        <Stack className={classes.documentDetailsContent} justify="flex-start">
          <TextInput
            label="ID"
            readOnly
            value={docID}
            rightSection={<CopyButton value={docID || ""} />}
          />
          <TextInput
            label="Version ID"
            readOnly
            value={docVerID}
            rightSection={<CopyButton value={docVerID || ""} />}
          />
          <TextInput
            label="Owner"
            readOnly
            value={groupData?.name || OWNER_ME}
            rightSection={<CopyButton value={groupData?.name || OWNER_ME} />}
          />
          <Group>
            <TagsInput
              rightSection={<EditTagsButton />}
              label="Tags"
              readOnly
              value={doc?.tags?.map(t => t.name) || []}
              mt="md"
            />
          </Group>
          <Group>
            <CustomFields docID={docID} doc={doc} isLoading={isLoading} />
          </Group>
          <TextInput label="OCR Language" readOnly value={ocrLang} mt="md" />
        </Stack>
      </Group>
    )
  }

  return <></>
}

function EditTagsButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const docID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {currentData: doc} = useGetDocumentQuery(docID ?? skipToken)

  const onClick = () => {
    open()
  }

  const onSubmit = () => {
    close()
  }

  const onCancel = () => {
    close()
  }

  return (
    <>
      <ActionIcon variant="default" onClick={onClick}>
        <IconEdit stroke={1.4} />
      </ActionIcon>
      {doc && (
        <EditNodeTagsModal
          opened={opened}
          node={doc}
          onSubmit={onSubmit}
          onCancel={onCancel}
        />
      )}
    </>
  )
}
