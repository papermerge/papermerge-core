import PanelContext from "@/contexts/PanelContext"
import {ActionIcon, Box, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconUserShare} from "@tabler/icons-react"
import {forwardRef, useContext} from "react"

import ShareNodesModal from "@/components/ShareNodesModal"
import type {PanelMode} from "@/types"

interface Args {
  hidden?: boolean
}

const ShareButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {hidden} = props
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)

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
        node_ids={["1", "2"]}
        onSubmit={close}
        onCancel={close}
      />
    </Box>
  )
})

export default ShareButton
