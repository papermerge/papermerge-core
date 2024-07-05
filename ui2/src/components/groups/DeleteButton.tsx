import {Button} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"

import {
  selectSelectedIds,
  selectGroupsByIds,
  clearSelection
} from "@/slices/groups"
import {openModal} from "@/components/modals/Generic"

import type {Group} from "@/types"

import RemoveGroupModal from "./RemoveModal"
import {RootState} from "@/app/types"

export default function DeleteButton() {
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)
  const groups = useSelector<RootState>(state =>
    selectGroupsByIds(state, selectedIds)
  ) as Array<Group>

  const onClick = () => {
    openModal<Group[], {groups: Array<Group>}>(RemoveGroupModal, {
      groups: groups
    })
      .then(() => {
        dispatch(clearSelection())
      })
      .catch(() => dispatch(clearSelection()))
  }
  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}
