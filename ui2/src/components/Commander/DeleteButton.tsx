import {useContext} from "react"
import {useDisclosure} from "@mantine/hooks"

import {Tooltip, ActionIcon} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {PanelMode} from "@/types"
import DeleteNodesModal from "./DeleteModal"
import {useSelector, useDispatch} from "react-redux"
import {
  selectSelectedNodeIds,
  clearNodesSelection
} from "@/slices/dualPanel/dualPanel"
import {RootState} from "@/app/types"
import {selectNodesByIds} from "@/features/nodes/nodesSlice"
import PanelContext from "@/contexts/PanelContext"

export default function DeleteButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()
  const selectedIds = useSelector((state: RootState) =>
    selectSelectedNodeIds(state, mode)
  )
  const selectedNodes = useSelector((state: RootState) =>
    selectNodesByIds(state, selectedIds || [])
  )

  const onSubmit = () => {
    dispatch(clearNodesSelection(mode))
    close()
  }

  const onCancel = () => {
    dispatch(clearNodesSelection(mode))
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
