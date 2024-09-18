import {useState} from "react"

import {useExtractPagesMutation} from "@/features/document/apiSlice"
import {
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Space,
  Text
} from "@mantine/core"

import type {ClientPage, FolderType} from "@/types"

type ExtractPagesModalArgs = {
  sourcePages: ClientPage[]
  sourceDocID: string
  targetFolder: FolderType
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function ExtractPagesModal({
  sourcePages,
  sourceDocID,
  targetFolder,
  opened,
  onSubmit,
  onCancel
}: ExtractPagesModalArgs) {
  const [extractPages, {isLoading}] = useExtractPagesMutation()
  const [errorMessage, setErrorMessage] = useState("")
  //const nodeTitles = nodes.map(g => g.title).join(",")

  const localSubmit = async () => {
    //await extractPages(nodes.map(n => n.id))
    onSubmit()
  }
  const localCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <Modal title="Extract Pages" opened={opened} onClose={localCancel}>
      <Container>
        <p>
          Do you want to extract selected pages to folder
          <Text c="green">{targetFolder.title}</Text>?
        </p>
        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localCancel}>
            Cancel
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={isLoading}
          >
            Yes, extract
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
