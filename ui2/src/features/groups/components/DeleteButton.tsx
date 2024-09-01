import {useEffect, useState} from "react"
import {Button} from "@mantine/core"
import {IconTrash} from "@tabler/icons-react"
import {useDispatch, useSelector} from "react-redux"
import {useNavigate} from "react-router-dom"

import {
  selectSelectedIds,
  selectGroupsByIds,
  clearSelection,
  selectGroupById
} from "@/features/groups/slice"
import {openModal} from "@/components/modals/Generic"

import type {Group} from "@/types"

import {RemoveGroupModal, RemoveGroupsModal} from "./DeleteModal"
import {RootState} from "@/app/types"

export function DeleteGroupButton({groupId}: {groupId: string}) {
  const [redirect, setRedirect] = useState<boolean>(false)
  const navigate = useNavigate()
  const deletedGroup = useSelector<RootState>(state =>
    selectGroupById(state, groupId)
  )

  useEffect(() => {
    if (redirect && deletedGroup == null) {
      navigate("/groups/")
    }
  }, [deletedGroup, redirect])

  const onClick = () => {
    openModal<Group[], {groupId: string}>(RemoveGroupModal, {
      groupId: groupId
    })
      .then(() => {
        setRedirect(true)
      })
      .catch(() => {})
  }

  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}

export function DeleteGroupsButton() {
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)

  const onClick = () => {
    openModal<Group[], {groupIds: Array<string>}>(RemoveGroupsModal, {
      groupIds: selectedIds
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
