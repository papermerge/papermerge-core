import {useState} from "react"

import {useDeleteNodesMutation} from "@/features/nodes/apiSlice"
import {Button, Container, Group, Loader, Modal, Space} from "@mantine/core"

import type {NodeType} from "@/types"

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
    <Modal title="Delete Nodes" opened={opened} onClose={localCancel}>
      <Container>
        <p>Are you sure you want to delete following nodes: {nodeTitles}?</p>
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
            color={"red"}
          >
            Delete
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
