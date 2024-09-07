import {useDisclosure} from "@mantine/hooks"
import {useContext} from "react"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconTag} from "@tabler/icons-react"

import {useSelector, useDispatch} from "react-redux"
import {
  selectSelectedNodeIds,
  clearNodesSelection
} from "@/slices/dualPanel/dualPanel"
import {EditNodeTagsModal} from "@/features/nodes/components/EditNodeTags"

import type {RootState} from "@/app/types"

import type {NodeType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {selectNodesByIds} from "@/features/nodes/nodesSlice"

export default function EditNodeTagsButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useDispatch()
  const selectedIds = useSelector((state: RootState) =>
    selectSelectedNodeIds(state, mode)
  )
  const selectedNodes = useSelector((state: RootState) =>
    selectNodesByIds(state, selectedIds || [])
  )
  let node: NodeType = selectedNodes[0]

  const onClick = () => {
    if (selectedNodes.length < 1) {
      console.log("Error: no selected nodes")
      return
    }

    node = selectedNodes[0]
    open()
  }

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
      <Tooltip label="Edit tags" withArrow>
        <ActionIcon size={"lg"} variant="default" onClick={onClick}>
          <IconTag stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <EditNodeTagsModal
        opened={opened}
        node={node}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  )
}
