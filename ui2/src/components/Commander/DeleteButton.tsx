import {useContext} from "react"

import {Tooltip, ActionIcon} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {openModal} from "@/components/modals/Generic"
import {NodeType, PanelMode} from "@/types"
import DeleteNodesModal from "./DeleteModal"
import {useSelector, useDispatch} from "react-redux"
import {
  selectSelectedNodes,
  clearNodesSelection
} from "@/slices/dualPanel/dualPanel"
import {RootState} from "@/app/types"

import PanelContext from "@/contexts/PanelContext"

export default function DeleteButton() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()
  const nodes = useSelector((state: RootState) =>
    selectSelectedNodes(state, mode)
  ) as NodeType[]

  const onClick = () => {
    openModal<string[], {nodes: NodeType[]}>(DeleteNodesModal, {
      nodes: nodes
    })
      .then(() => {
        dispatch(clearNodesSelection(mode))
      })
      .catch(() => {})
  }

  return (
    <Tooltip withArrow label="Delete">
      <ActionIcon size="lg" onClick={onClick} color={"red"}>
        <IconTrash />
      </ActionIcon>
    </Tooltip>
  )
}
