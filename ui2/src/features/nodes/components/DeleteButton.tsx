import {useContext} from "react"
import {useDisclosure} from "@mantine/hooks"

import {Tooltip, ActionIcon} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {PanelMode} from "@/types"
import DeleteNodesModal from "./DeleteModal"
import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {
  selectSelectedNodeIds,
  commanderSelectionCleared
} from "@/features/ui/uiSlice"

import {selectNodesByIds} from "@/features/nodes/nodesSlice"
import PanelContext from "@/contexts/PanelContext"

export default function DeleteButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const selectedIds = useAppSelector(s => selectSelectedNodeIds(s, mode))
  const selectedNodes = useAppSelector(s =>
    selectNodesByIds(s, selectedIds as string[])
  )

  const onSubmit = () => {
    dispatch(commanderSelectionCleared(mode))
    close()
  }

  const onCancel = () => {
    dispatch(commanderSelectionCleared(mode))
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
