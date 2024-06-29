import {useState} from "react"

import {useSelector} from "react-redux"
import {Button, Group} from "@mantine/core"
import axios from "axios"
import {getRestAPIURL, getDefaultHeaders} from "@/utils"
import {selectSelectedIds} from "@/slices/groups"
import GenericModal, {openModal} from "@/components/modals/Generic"

import type {Group as GroupType} from "@/types"

import GroupForm from "./GroupForm"

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
      {selectedIds.length > 1 ? <DeleteButton /> : ""}
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
  const onClick = () => {
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

function DeleteButton() {
  return <Button color="red">Delete</Button>
}

type GenericModalArgs = {
  modalTitle: string
  groupId?: number
  onOK: (value: GroupType) => void
  onCancel: (reason?: any) => void
}

function GroupModal({groupId, modalTitle, onOK, onCancel}: GenericModalArgs) {
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
      await axios.post(
        `${rest_api_url}/api/groups/`,
        {name, scopes},
        {
          headers: defaultHeaders
        }
      )
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
    >
      <GroupForm onNameChange={onNameChange} onPermsChange={onPermsChange} />
      {errorMessage}
    </GenericModal>
  )
}
