import {useAppDispatch} from "@/app/hooks"
import {Box, Button, Tooltip, useModalsStack} from "@mantine/core"
import {forwardRef} from "react"

import {ManageAccessModal} from "@/features/shared_nodes/components/ManageAccessModal/ManageAccessModal"

interface Args {
  hidden?: boolean
  node_id: string
}

const ManageAccessButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {hidden, node_id} = props
  const dispatch = useAppDispatch()
  const stack = useModalsStack(["manage-access", "manage-role"])

  const onClick = () => {
    stack.open("manage-access")
  }

  const onClose = () => {
    stack.closeAll()
    //dispatch(commanderAllSelectionsCleared())
  }

  return (
    <Box>
      <Tooltip label="Manage Access" withArrow>
        <Button
          style={hidden ? {display: "None"} : {}}
          ref={ref}
          size={"sm"}
          variant="default"
          onClick={onClick}
        >
          Manage Access
        </Button>
      </Tooltip>
      <ManageAccessModal stack={stack} node_id={node_id} onClose={onClose} />
    </Box>
  )
})

export default ManageAccessButton
