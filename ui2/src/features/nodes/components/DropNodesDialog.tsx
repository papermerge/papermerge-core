import {useState} from "react"

import type {FolderType, NodeType} from "@/types"
import {
  Button,
  Container,
  Group,
  Loader,
  Modal,
  Space,
  Text
} from "@mantine/core"

type DropNodesModalArgs = {
  sourceNodes: NodeType[]
  targetFolder: FolderType
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function DropNodesModal({
  sourceNodes,
  targetFolder,
  opened,
  onSubmit,
  onCancel
}: DropNodesModalArgs) {
  const [errorMessage, setErrorMessage] = useState<string>("")
  const movedNodesTitles = sourceNodes.map(p => p.title).join(",")

  const onMoveNodes = async () => {}
  const localCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <Modal title="Move Nodes" opened={opened} size="lg" onClose={localCancel}>
      <Container>
        <Text>
          Move{" "}
          <Text c="indigo" span>
            {movedNodesTitles}
          </Text>{" "}
          to
          <Text c="green" px="xs" span>
            {targetFolder.title}
          </Text>
          ?
        </Text>
        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localCancel}>
            Cancel
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={onMoveNodes}
            disabled={false}
          >
            Yes, move
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
