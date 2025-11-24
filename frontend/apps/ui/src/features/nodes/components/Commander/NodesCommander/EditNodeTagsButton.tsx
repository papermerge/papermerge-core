import {ActionIcon, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTag} from "@tabler/icons-react"
import {useContext} from "react"

import {useAppDispatch} from "@/app/hooks"

import {commanderSelectionCleared} from "@/features/ui/uiSlice"

import {EditNodeTagsModal} from "@/components/EditNodeTags"

import type {NodeType, PanelMode} from "@/types"

import PanelContext from "@/contexts/PanelContext"

interface Args {
  selectedNodes: NodeType[]
}

export default function EditNodeTagsButton({selectedNodes = []}: Args) {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
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
