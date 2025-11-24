import {useDisclosure} from "@mantine/hooks"

import {useAppDispatch} from "@/app/hooks"
import {usePanel} from "@/features/ui/hooks/usePanel"
import {clearPanelSelection} from "@/features/ui/panelRegistry"
import {NodeType} from "@/types"
import {ActionIcon, Tooltip} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import DeleteNodesModal from "./DeleteModal"

interface Args {
  selectedNodes: NodeType[]
}

export default function DeleteButton({selectedNodes}: Args) {
  const [opened, {open, close}] = useDisclosure(false)
  const {panelId} = usePanel()
  const dispatch = useAppDispatch()

  const onSubmit = () => {
    dispatch(clearPanelSelection({panelId}))
    close()
  }

  const onCancel = () => {
    dispatch(clearPanelSelection({panelId}))
    close()
  }

  return (
    <>
      <Tooltip withArrow label="Delete">
        <ActionIcon size="lg" onClick={open} color={"red"}>
          <IconTrash />
        </ActionIcon>
      </Tooltip>
      <DeleteNodesModal
        opened={opened}
        nodes={selectedNodes}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  )
}
