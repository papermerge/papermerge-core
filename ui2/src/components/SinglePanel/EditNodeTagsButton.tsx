import {useContext} from "react"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconTag} from "@tabler/icons-react"

import {useSelector, useDispatch} from "react-redux"
import {
  selectSelectedNodes,
  nodeUpdated,
  clearNodesSelection
} from "@/slices/dualPanel/dualPanel"
import edit_node_tags from "@/components/modals/EditNodeTags"

import type {RootState} from "@/app/types"

import type {NodeType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

export default function EditNodeTagsButton() {
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()
  const selectedNodes = useSelector((state: RootState) =>
    selectSelectedNodes(state, mode)
  )
  const onEditNodeTags = () => {
    if (selectedNodes.length < 1) {
      console.log("Error: no selected nodes")
      return
    }

    let node: NodeType = selectedNodes[0]

    edit_node_tags(node)
      .then((node: NodeType) => {
        dispatch(nodeUpdated({node, mode}))
      })
      .finally(() => dispatch(clearNodesSelection(mode)))
  }

  return (
    <Tooltip label="Edit tags" withArrow>
      <ActionIcon size={"lg"} variant="default" onClick={onEditNodeTags}>
        <IconTag stroke={1.4} />
      </ActionIcon>
    </Tooltip>
  )
}
