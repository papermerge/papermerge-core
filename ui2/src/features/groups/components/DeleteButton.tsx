import {Button} from "@mantine/core"
import {useDisclosure} from "@mantine/hooks"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {selectSelectedIds, clearSelection} from "@/features/groups/groupsSlice"

import {RemoveGroupModal, RemoveGroupsModal} from "./DeleteModal"

export function DeleteGroupButton({groupId}: {groupId: string}) {
  const [opened, {open, close}] = useDisclosure(false)
  const navigate = useNavigate()

  const onSubmit = () => {
    navigate("/groups/")
    close()
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        Delete
      </Button>
      <RemoveGroupModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={close}
        groupId={groupId}
      />
    </>
  )
}

export function DeleteGroupsButton() {
  const [opened, {open, close}] = useDisclosure(false)
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)

  const onSubmit = () => {
    dispatch(clearSelection())
    close()
  }

  const onCancel = () => {
    dispatch(clearSelection())
    close()
  }

  return (
    <>
      <Button leftSection={<IconTrash />} onClick={open} variant={"default"}>
        Delete
      </Button>
      <RemoveGroupsModal
        opened={opened}
        onSubmit={onSubmit}
        onCancel={onCancel}
        groupIds={selectedIds}
      />
    </>
  )
}
