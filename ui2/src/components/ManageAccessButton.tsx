import {Box, Button, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {forwardRef} from "react"

import {ManageAccessModal} from "@/features/shared_nodes/components/ManageAccessModal/ManageAccessModal"

interface Args {
  hidden?: boolean
  node_id: string
}

const ManageAccessButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {hidden, node_id} = props
  const [opened, {open, close}] = useDisclosure(false)

  return (
    <Box>
      <Tooltip label="Manage Access" withArrow>
        <Button
          style={hidden ? {display: "None"} : {}}
          ref={ref}
          size={"sm"}
          variant="default"
          onClick={open}
        >
          Manage Access
        </Button>
      </Tooltip>
      <ManageAccessModal
        opened={opened}
        node_id={node_id}
        onSubmit={close}
        onCancel={close}
      />
    </Box>
  )
})

export default ManageAccessButton
