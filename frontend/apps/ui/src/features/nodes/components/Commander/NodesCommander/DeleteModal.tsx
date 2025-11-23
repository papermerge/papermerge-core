import {useState} from "react"

import {useDeleteNodesMutation} from "@/features/nodes/storage/api"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"

import type {NodeType} from "@/types"
import {useTranslation} from "react-i18next"

type DeleteNodesModalArgs = {
  nodes: NodeType[]
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

/* Deletes multiple nodes */
export default function DeleteNodesModal({
  nodes,
  opened,
  onSubmit,
  onCancel
}: DeleteNodesModalArgs) {
  const {t} = useTranslation()
  const [deletedNodes, {isLoading}] = useDeleteNodesMutation()
  const [errorMessage, setErrorMessage] = useState("")
  const nodeTitles = nodes.map(g => g.title).join(",")

  const localSubmit = async () => {
    await deletedNodes(nodes.map(n => n.id))
    onSubmit()
  }
  const localCancel = () => {
    setErrorMessage("")

    onCancel()
  }

  return (
    <Modal
      title={t("nodes.delete.many.title")}
      opened={opened}
      onClose={localCancel}
    >
      <Container>
        <p>
          {t("nodes.delete.many.description")}: {nodeTitles}?
        </p>
        {errorMessage}
        <Space h="md" />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localCancel}>
            {t("common.cancel")}
          </Button>
          <Button
            leftSection={isLoading && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={isLoading}
            color={"red"}
          >
            {t("common.delete")}
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
