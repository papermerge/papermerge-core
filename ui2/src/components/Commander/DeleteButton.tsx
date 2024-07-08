import {useContext} from "react"

import {Tooltip, ActionIcon} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {openModal} from "@/components/modals/Generic"
import {NodeType, PanelMode} from "@/types"
import DeleteNodesModal from "./DeleteModal"
import {useSelector} from "react-redux"
import {selectSelectedNodes} from "@/slices/dualPanel"
import {RootState} from "@/app/types"

import PanelContext from "@/contexts/PanelContext"

export default function DeleteButton() {
  const mode: PanelMode = useContext(PanelContext)
  const nodes = useSelector((state: RootState) =>
    selectSelectedNodes(state, mode)
  ) as NodeType[]

  const onClick = () => {
    openModal<NodeType[], {nodes: NodeType[]}>(DeleteNodesModal, {
      nodes: nodes
    })
      .then(() => {
        //setRedirect(true)
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
