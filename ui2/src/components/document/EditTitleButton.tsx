import {EditNodeTitleModal} from "@/features/nodes/components/EditNodeTitle"
import {ActionIcon, Box, Skeleton, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"
import {forwardRef} from "react"

import type {DocumentType} from "@/types"

interface Args {
  hidden?: boolean
  doc?: DocumentType
  nodeID?: string
  isFetching: boolean
  isError: boolean
}

const EditTitleButton = forwardRef<HTMLButtonElement, Args>((props, ref) => {
  const {hidden, doc, nodeID, isFetching, isError} = props
  const [opened, {open, close}] = useDisclosure(false)

  if (isFetching) {
    return <ActionButtonSkeleton />
  }

  if (isError) {
    return (
      <ActionIcon>
        <IconEdit stroke={1.4} color={"red"} />
      </ActionIcon>
    )
  }

  return (
    <Box>
      <Tooltip label="Change title" withArrow>
        <ActionIcon
          style={hidden ? {display: "None"} : {}}
          ref={ref}
          size={"lg"}
          variant="default"
          onClick={open}
        >
          <IconEdit stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <EditNodeTitleModal
        opened={opened}
        node={{id: nodeID!, title: doc?.title!}}
        onSubmit={close}
        onCancel={close}
      />
    </Box>
  )
})

function ActionButtonSkeleton() {
  return (
    <div>
      <Skeleton>
        <ActionIcon size={"lg"} variant="default">
          <IconEdit stroke={1.4} />
        </ActionIcon>
      </Skeleton>
    </div>
  )
}

export default EditTitleButton
