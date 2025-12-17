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
import {useTranslation} from "react-i18next"

import {useGetDocumentQuery} from "@/features/document/store/apiSlice"
import {selectDocumentVersionOCRLang} from "@/features/document/store/documentVersSlice"
import {skipToken} from "@reduxjs/toolkit/query"
import {IconEdit} from "@tabler/icons-react"
import classes from "./DocumentDetails.module.css"

import {OWNER_ME} from "@/cconstants"
import CopyButton from "@/components/CopyButton"
import {EditNodeTagsModal} from "@/components/EditNodeTags"
import type {DocumentType} from "@/features/document/types"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {selectPanelAllCustom} from "@/features/ui/panelRegistry"
import type {ClientDocumentVersion} from "@/types"
import DocumentDetailsToggle from "../DocumentDetailsToggle"
import CustomFields from "./CustomFields"
import DocumentDetailsResizer, {
  DOCUMENT_DETAILS_DEFAULT_WIDTH
} from "./DocumentDetailsResizer"
import DocumentLangSelect from "./DocumentLangSelect"

interface Args {
  doc?: DocumentType
  docVer?: ClientDocumentVersion
  isLoading: boolean
}

export default function DocumentDetails({doc, docVer, isLoading}: Args) {
  const {t} = useTranslation()

  const {panelId} = usePanel()

  const {documentDetailsPanelIsOpen: isOpen, documentDetailsWidth} =
    useAppSelector(s => selectPanelAllCustom(s, panelId))
  const ocrLang = useAppSelector(s => selectDocumentVersionOCRLang(s, panelId))

  // Use stored width or default
  const widthPercent = documentDetailsWidth ?? DOCUMENT_DETAILS_DEFAULT_WIDTH

  if (!doc || isLoading) {
    return (
      <>
        <DocumentDetailsResizer />
        <div
          className={classes.documentDetailsOpened}
          style={{width: `${widthPercent}%`}}
        >
          <DocumentDetailsToggle />
          <Stack
            className={classes.documentDetailsContent}
            justify="flex-start"
          >
            <Skeleton height={"20"} />
            <Skeleton height={"20"} />
            <Skeleton height={"20"} />
          </Stack>
        </div>
      </>
    )
  }

  if (isOpen) {
    return (
      <>
        <DocumentDetailsResizer />
        <div
          className={classes.documentDetailsOpened}
          style={{width: `${widthPercent}%`}}
        >
          <Stack
            className={classes.documentDetailsContent}
            justify="flex-start"
          >
            <TextInput
              label="ID"
              readOnly
              value={doc.id}
              rightSection={<CopyButton value={doc.id || ""} />}
            />
            <TextInput
              label={t("common.version_id")}
              readOnly
              value={docVer?.id}
              rightSection={<CopyButton value={docVer?.id || ""} />}
            />
            <TextInput
              label={t("common.version_number")}
              readOnly
              value={docVer?.number}
              rightSection={<CopyButton value={`${docVer?.number}` || ""} />}
            />

            <TextInput
              label={t("common.owner")}
              readOnly
              value={doc?.owner_name || t(OWNER_ME)}
              rightSection={
                <CopyButton value={doc?.owner_name || t(OWNER_ME)} />
              }
            />
            <DocumentLangSelect />
            <Group>
              <TagsInput
                rightSection={<EditTagsButton doc_id={doc.id} />}
                label={t("common.tags")}
                readOnly
                value={doc?.tags?.map(t => t.name) || []}
                mt="md"
              />
            </Group>
            <Group>
              <CustomFields doc={doc} isLoading={isLoading} />
            </Group>
          </Stack>
        </div>
      </>
    )
  }

  return <></>
}

interface EditTagsButtonArgs {
  doc_id?: string
}

function EditTagsButton({doc_id}: EditTagsButtonArgs) {
  const [opened, {open, close}] = useDisclosure(false)
  const {currentData: doc} = useGetDocumentQuery(doc_id ?? skipToken)

  if (!doc_id) {
    return (
      <Skeleton>
        <IconEdit />
      </Skeleton>
    )
  }

  return (
    <>
      <ActionIcon variant="transparent" onClick={open}>
        <IconEdit />
      </ActionIcon>
      <EditNodeTagsModal
        opened={opened}
        node={{id: doc_id, tags: doc?.tags || []}}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}
