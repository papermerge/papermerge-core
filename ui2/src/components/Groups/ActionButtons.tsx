import {useState} from "react"

import {useDispatch, useSelector} from "react-redux"
import {Button, Group} from "@mantine/core"
import axios from "axios"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import {
  selectSelectedIds,
  selectGroupById,
  selectGroupsByIds,
  selectionRemoveAll,
  fetchGroup,
  addGroup
} from "@/slices/groups"
import GenericModal, {openModal} from "@/components/modals/Generic"
import {store} from "@/app/store"

import type {Group as GroupType} from "@/types"

import GroupForm from "./GroupForm"
import RemoveGroupModal from "./RemoveModal"
import {RootState} from "@/app/types"

type ModalPropsType = {
  modalTitle: string
  groupId?: number
}

export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? <EditButton groupId={selectedIds[0]} /> : ""}
      {selectedIds.length >= 1 ? <DeleteButton /> : ""}
    </Group>
  )
}

function NewButton() {
  const onClick = () => {
    openModal<GroupType, ModalPropsType>(GroupModal, {
      modalTitle: "New Group"
    }).then((value: GroupType) => {})
  }
  return <Button onClick={onClick}>New</Button>
}

function EditButton({groupId}: {groupId: number}) {
  const dispatch = useDispatch()

  const onClick = () => {
    dispatch(fetchGroup(groupId))
    openModal<GroupType, ModalPropsType>(GroupModal, {
      modalTitle: "Edit Group",
      groupId: groupId
    })
      .then((value: GroupType) => {
        // 1. user clicked "submit"
        // 2. group was created on server side as well in redux store
        // 3. value contains newly created group object
      })
      .catch(() => {
        // 1. user clicked cancel
      })
  }
  return <Button onClick={onClick}>Edit</Button>
}

type RemoveModalPropsType = {
  groups: Array<GroupType>
}

function DeleteButton() {
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)
  const groups = useSelector<RootState>(state =>
    selectGroupsByIds(state, selectedIds)
  ) as Array<GroupType>

  const onClick = () => {
    openModal<GroupType[], RemoveModalPropsType>(RemoveGroupModal, {
      groups: groups
    })
      .then((g: GroupType[]) => {})
      .catch(() => {})
      .finally(() => {
        dispatch(selectionRemoveAll())
      })
  }
  return (
    <Button onClick={onClick} color="red">
      Delete
    </Button>
  )
}

type GenericModalArgs = {
  modalTitle: string
  groupId?: number
  onOK: (value: GroupType) => void
  onCancel: (reason?: any) => void
}

function GroupModal({groupId, modalTitle, onOK, onCancel}: GenericModalArgs) {
  const groupDetails = useSelector<RootState>(state =>
    selectGroupById(state, groupId)
  )
  const [scopes, setScopes] = useState<string[]>([])
  const [name, setName] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (signal: AbortSignal) => {
    const rest_api_url = getRestAPIURL()
    const defaultHeaders = getDefaultHeaders()
    if (groupId) {
      await axios.patch(
        `${rest_api_url}/api/groups/${groupId}/`,
        {name, scopes},
        {
          headers: defaultHeaders
        }
      )
    } else {
      store.dispatch(addGroup({name, scopes}))
    }
  }
  const handleCancel = () => {
    setErrorMessage("")

    onCancel()
  }
  const onNameChange = (name: string) => setName(name)
  const onPermsChange = (perms: string[]) => setScopes(perms)

  return (
    <GenericModal
      modal_title={modalTitle}
      onSubmit={handleSubmit}
      onCancel={handleCancel}
      size={"xl"}
    >
      <GroupForm onNameChange={onNameChange} onPermsChange={onPermsChange} />
      {errorMessage}
    </GenericModal>
  )
}
