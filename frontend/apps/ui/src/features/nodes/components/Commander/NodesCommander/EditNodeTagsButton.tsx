import {usePanel} from "@/features/ui/hooks/usePanel"
import {ActionIcon, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTag} from "@tabler/icons-react"

import {useAppDispatch} from "@/app/hooks"

import {EditNodeTagsModal} from "@/components/EditNodeTags"

import {clearPanelSelection} from "@/features/ui/panelRegistry"
import type {NodeType} from "@/types"

interface Args {
  selectedNodes: NodeType[]
}

export default function EditNodeTagsButton({selectedNodes = []}: Args) {
  const [opened, {open, close}] = useDisclosure(false)
  const {panelId} = usePanel()
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
    dispatch(clearPanelSelection({panelId}))
    close()
  }

  const onCancel = () => {
    dispatch(clearPanelSelection({panelId}))
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
