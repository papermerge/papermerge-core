import {useAppDispatch} from "@/app/hooks"
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

import {useMoveNodesMutation} from "@/features/nodes/storage/api"
import {dragEnded} from "@/features/ui/uiSlice"
import {useTranslation} from "react-i18next"

type DropNodesModalArgs = {
  sourceNodes: NodeType[]
  targetFolder: FolderType
  sourceFolderID: string
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function DropNodesModal({
  sourceNodes,
  targetFolder,
  sourceFolderID,
  opened,
  onSubmit,
  onCancel
}: DropNodesModalArgs) {
  const {t} = useTranslation()
  const [errorMessage, setErrorMessage] = useState<string>("")
  const movedNodesTitles = sourceNodes.map(p => p.title).join(",")
  const [moveNodes, {isLoading}] = useMoveNodesMutation()
  const dispatch = useAppDispatch()

  const onMoveNodes = async () => {
    const data = {
      body: {
        source_ids: sourceNodes.map(p => p.id),
        target_id: targetFolder.id
      },
      sourceFolderID: sourceFolderID
    }
    await moveNodes(data)
    dispatch(dragEnded())
    onSubmit()
    //dispatch(commanderAllSelectionsCleared())
  }
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
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={onMoveNodes}
            disabled={isLoading}
          >
            Yes, move
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
