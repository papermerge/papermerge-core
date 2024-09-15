import {useAppSelector} from "@/app/hooks"

import PanelContext from "@/contexts/PanelContext"
import {useGetDocumentQuery} from "@/features/document/apiSlice"
import {EditNodeTitleModal} from "@/features/nodes/components/EditNodeTitle"
import {selectCurrentNodeID} from "@/features/ui/uiSlice"
import {ActionIcon, Skeleton, Text, Tooltip} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconEdit} from "@tabler/icons-react"
import {useContext} from "react"

import type {PanelMode} from "@/types"

export default function EditTitleButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const mode: PanelMode = useContext(PanelContext)
  const currentNodeID = useAppSelector(s => selectCurrentNodeID(s, mode))
  const {
    currentData: doc,
    isFetching,
    isError,
    error
  } = useGetDocumentQuery(currentNodeID!)

  if (isFetching) {
    return <ActionButtonSkeleton />
  }

  if (isError) {
    return <Text>{`${error}`}</Text>
  }

  return (
    <>
      <Tooltip label="Change title" withArrow>
        <ActionIcon size={"lg"} variant="default" onClick={open}>
          <IconEdit stroke={1.4} />
        </ActionIcon>
      </Tooltip>
      <EditNodeTitleModal
        opened={opened}
        node={{id: currentNodeID!, title: doc?.title!}}
        onSubmit={close}
        onCancel={close}
      />
    </>
  )
}

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
