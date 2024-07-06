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
} from "@/slices/groups"
import {openModal} from "@/components/modals/Generic"

import type {Group} from "@/types"

import {RemoveGroupModal, RemoveGroupsModal} from "./DeleteModal"
import {RootState} from "@/app/types"

export function DeleteGroupButton({groupId}: {groupId: number}) {
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
    openModal<Group[], {groupId: number}>(RemoveGroupModal, {
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
  const groups = useSelector<RootState>(state =>
    selectGroupsByIds(state, selectedIds)
  ) as Array<Group>

  const onClick = () => {
    openModal<Group[], {groups: Array<Group>}>(RemoveGroupsModal, {
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
