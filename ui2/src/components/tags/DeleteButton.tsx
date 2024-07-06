import {useEffect} from "react"
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

//import {openModal} from "@/components/modals/Generic"

//import type {Group} from "@/types"

//import {RemoveGroupModal, RemoveGroupsModal} from "./RemoveModal"
import {RootState} from "@/app/types"

export function DeleteGroupButton({groupId}: {groupId: number}) {
  const navigate = useNavigate()
  const deletedGroup = useSelector<RootState>(state =>
    selectGroupById(state, groupId)
  )

  useEffect(() => {
    // (1)
    // waits until deletedGroup does not exit i.e. group
    // was removed from storage. Only then navigate to
    // "/groups/" page (to make sure delete group does not appear in the list)
    if (!deletedGroup) {
      navigate("/groups/")
    }
  }, [deletedGroup])

  const onClick = () => {
    /*
    openModal<Group[], {groupId: number}>(RemoveGroupModal, {
      groupId: groupId
    })
      .then(() => {
        // In ideal world it should be following line that
        // navigates to "/groups/" page
        // navigate("/groups/")
        // In our case, we use (1) for navigating to "/groups/" page
      })
      .catch(() => {})
    */
  }

  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}

export function DeleteGroupsButton() {
  /*
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)
  const groups = useSelector<RootState>(state =>
    selectGroupsByIds(state, selectedIds)
  ) as Array<Group>
  */
  const onClick = () => {
    /*
    openModal<Group[], {groups: Array<Group>}>(RemoveGroupsModal, {
      groups: groups
    })
      .then(() => {
        dispatch(clearSelection())
      })
      .catch(() => dispatch(clearSelection()))
    */
  }
  return (
    <Button leftSection={<IconTrash />} onClick={onClick} variant={"default"}>
      Delete
    </Button>
  )
}
