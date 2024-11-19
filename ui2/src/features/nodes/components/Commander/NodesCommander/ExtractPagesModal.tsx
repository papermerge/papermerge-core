import {useEffect, useState} from "react"

import {
  useExtractPagesMutation,
  useGetDocumentQuery
} from "@/features/document/apiSlice"
import type {
  ClientPage,
  ExtractPagesResponse,
  ExtractStrategyType,
  FolderType,
  ServerErrorType
} from "@/types"
import {drop_extension} from "@/utils"
import {
  Button,
  Checkbox,
  Container,
  Group,
  Loader,
  Modal,
  Space,
  Text,
  TextInput
} from "@mantine/core"

type ExtractPagesModalArgs = {
  sourcePages: ClientPage[]
  sourceDocID: string
  sourceDocParentID: string
  targetFolder: FolderType
  opened: boolean
  onSubmit: (resp?: ExtractPagesResponse) => void
  onCancel: () => void
}

export default function ExtractPagesModal({
  sourcePages,
  sourceDocID,
  sourceDocParentID,
  targetFolder,
  opened,
  onSubmit,
  onCancel
}: ExtractPagesModalArgs) {
  const [extractPages, {isLoading}] = useExtractPagesMutation()
  const {currentData: doc} = useGetDocumentQuery(sourceDocID)
  const [errorMessage, setErrorMessage] = useState<string>("")
  const [titleFormat, setTitleFormat] = useState<string>("")
  const [separateDocs, setSeparateDocs] = useState<boolean>(false)
  const [titleFormatDescription, setTitleFormatDescription] =
    useState<string>("")

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
      const resp = await extractPages(data)
      onSubmit(resp.data)
    } catch (e: unknown) {
      const err = e as ServerErrorType
      setErrorMessage(err.data.detail)
    }
  }
  const localCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <Modal
      title="Extract Pages"
      opened={opened}
      size="lg"
      onClose={localCancel}
    >
      <Container>
        <Text>
          Do you want to extract selected pages to folder
          <Text c="green" px="xs" span>
            {targetFolder.title}
          </Text>
          ?
        </Text>
        <TextInput
          my="md"
          label="Title Format"
          rightSectionPointerEvents="none"
          description={titleFormatDescription}
          rightSection={".pdf"}
          value={titleFormat}
          onChange={event => setTitleFormat(event.currentTarget.value)}
        />
        <Checkbox
          label="Extract each page into separate document"
          my="md"
          checked={separateDocs}
          onChange={event => setSeparateDocs(event.currentTarget.checked)}
        />
        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localCancel}>
            Cancel
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={onExtractPages}
            disabled={isLoading}
          >
            Yes, extract
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
