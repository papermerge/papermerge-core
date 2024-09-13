import {useDisclosure} from "@mantine/hooks"
import {useContext} from "react"
import {Tooltip, ActionIcon} from "@mantine/core"
import {IconEdit} from "@tabler/icons-react"

import {useAppSelector, useAppDispatch} from "@/app/hooks"

import {EditNodeTitleModal} from "@/features/nodes/components/EditNodeTitle"

import type {RootState} from "@/app/types"

import type {PanelMode, NodeType} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {
  selectSelectedNodeIds,
  commanderSelectionCleared
} from "@/features/ui/uiSlice"
import {selectNodesByIds} from "@/features/nodes/nodesSlice"

export default function EditNodeTitleButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const selectedIds = useAppSelector((state: RootState) =>
    selectSelectedNodeIds(state, mode)
  )
  const selectedNodes = useAppSelector(s =>
    selectNodesByIds(s, selectedIds as string[])
  )

  const dispatch = useAppDispatch()
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
      <Tooltip label="Change title" withArrow>
        <ActionIcon size={"lg"} variant="default" onClick={onClick}>
          <IconEdit stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <EditNodeTitleModal
        opened={opened}
        node={node}
        onSubmit={onSubmit}
        onCancel={onCancel}
      />
    </>
  )
}