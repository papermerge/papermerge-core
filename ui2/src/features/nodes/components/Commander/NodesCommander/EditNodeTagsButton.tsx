import {ActionIcon, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTag} from "@tabler/icons-react"
import {useContext} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {
  commanderSelectionCleared,
  selectSelectedNodeIds
} from "@/features/ui/uiSlice"

import {EditNodeTagsModal} from "@/components/EditNodeTags"

import type {NodeType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {selectNodesByIds} from "@/features/nodes/nodesSlice"

export default function EditNodeTagsButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const dispatch = useAppDispatch()
  const selectedIds = useAppSelector(s => selectSelectedNodeIds(s, mode))
  const selectedNodes = useAppSelector(s =>
    selectNodesByIds(s, selectedIds as string[])
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
    dispatch(commanderSelectionCleared(mode))
    close()
  }

  const onCancel = () => {
    dispatch(commanderSelectionCleared(mode))
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
