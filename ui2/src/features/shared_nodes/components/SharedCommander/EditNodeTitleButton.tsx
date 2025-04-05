import {ActionIcon, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"
import {useContext} from "react"

import {useAppDispatch, useAppSelector} from "@/app/hooks"

import {EditNodeTitleModal} from "@/features/nodes/components/EditNodeTitle"

import type {RootState} from "@/app/types"

import type {NodeType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"
import {selectNodesByIds} from "@/features/nodes/nodesSlice"
import {
  commanderSelectionCleared,
  selectSelectedNodeIds
} from "@/features/ui/uiSlice"

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
