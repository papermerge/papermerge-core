import {useDisclosure} from "@mantine/hooks"
import {useContext} from "react"

import {useAppDispatch} from "@/app/hooks"
import {NodeType, PanelMode} from "@/types"
import {ActionIcon, Tooltip} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import DeleteNodesModal from "./DeleteModal"

import {commanderSelectionCleared} from "@/features/ui/uiSlice"

import PanelContext from "@/contexts/PanelContext"

interface Args {
  selectedNodes: NodeType[]
}

export default function DeleteButton({selectedNodes}: Args) {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()

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
