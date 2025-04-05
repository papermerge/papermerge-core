import {ActionIcon, Box, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconUserShare} from "@tabler/icons-react"
import {forwardRef} from "react"

import ShareNodesModal from "@/features/shared_nodes/components/ShareNodesModal"

interface Args {
  hidden?: boolean
  node_ids: string[]
}

const ShareButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {hidden, node_ids} = props
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <Box>
      <Tooltip label="Share Document" withArrow>
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
        node_ids={node_ids}
        onSubmit={close}
        onCancel={close}
      />
    </Box>
  )
})

export default ShareButton
