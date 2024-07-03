import {useEffect, useState} from "react"

import {useDispatch, useSelector} from "react-redux"
import {IconPlus, IconEdit, IconX} from "@tabler/icons-react"
import {Button, Group, Box, LoadingOverlay} from "@mantine/core"
import {
  selectSelectedIds,
  selectUsersByIds,
  clearSelection,
  addUser,
  updateUser
} from "@/slices/users"

import type {User as UserType, SliceState} from "@/types"

import UserForm from "./UserForm"
//import RemoveGroupModal from "./RemoveModal"

import NewButton from "./NewButton"
import ChangePasswordButton from "./ChangePasswordButton"
import DeleteButton from "./DeleteButton"
import EditButton from "./EditButton"

export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? (
        <ChangePasswordButton userId={selectedIds[0]} />
      ) : (
        ""
      )}
      {selectedIds.length == 1 ? <EditButton userId={selectedIds[0]} /> : ""}
      {selectedIds.length >= 1 ? <DeleteButton /> : ""}
    </Group>
  )
}

type RemoveModalPropsType = {
  users: Array<UserType>
}
