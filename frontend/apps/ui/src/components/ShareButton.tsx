import {useAppDispatch} from "@/app/hooks"
import {commanderAllSelectionsCleared} from "@/features/ui/uiSlice"
import {ActionIcon, Box, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconUserShare} from "@tabler/icons-react"
import {forwardRef} from "react"

import ShareNodesModal from "@/features/shared_nodes/components/ShareNodesModal"
import {NodeType} from "@/types"

interface Args {
  hidden?: boolean
  selectedNodes: NodeType[]
}

const ShareButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const dispatch = useAppDispatch()
  const {hidden, selectedNodes} = props
  const [opened, {open, close}] = useDisclosure(false)

  const onLocalClose = () => {
    dispatch(commanderAllSelectionsCleared())
    close()
  }

  return (
    <Box>
      <Tooltip label="Share Documents and Folders" withArrow>
        <ActionIcon
          style={hidden ? {display: "None"} : {}}
          ref={ref}
          size={"lg"}
          variant="default"
          onClick={open}
        >
          <IconUserShare stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <ShareNodesModal
        opened={opened}
        selectedNodes={selectedNodes}
        onSubmit={onLocalClose}
        onCancel={onLocalClose}
      />
    </Box>
  )
})

export default ShareButton
