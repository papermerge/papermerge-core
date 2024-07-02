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
import {clearGroupDetails, selectGroupDetails} from "@/slices/groupDetails"
import {fetchGroupDetails} from "@/slices/groupDetails"
import GenericModal, {openModal} from "@/components/modals/Generic"
import {store} from "@/app/store"

import type {User as UserType, SliceState} from "@/types"

import UserForm from "./UserForm"
//import RemoveGroupModal from "./RemoveModal"

import NewButton from "./NewButton"
import ChangePasswordButton from "./ChangePasswordButton"
import DeleteButton from "./DeleteButton"
import EditButton from "./EditButton"

type ModalPropsType = {
  modalTitle: string
  groupId?: number
}
export default function ActionButtons() {
  const selectedIds = useSelector(selectSelectedIds)

  return (
    <Group>
      <NewButton />
      {selectedIds.length == 1 ? <ChangePasswordButton /> : ""}
      {selectedIds.length == 1 ? <EditButton /> : ""}
      {selectedIds.length >= 1 ? <DeleteButton /> : ""}
    </Group>
  )
}

type RemoveModalPropsType = {
  users: Array<UserType>
}

type GenericModalArgs = {
  modalTitle: string
  userId?: string
  onOK: (value: UserType) => void
  onCancel: (reason?: any) => void
}

function UserModal({userId, modalTitle, onOK, onCancel}: GenericModalArgs) {
  //const {status, error, data} = useSelector<RootState>(
  //  selectDetails
  //) as SliceState<UserType>
  const [scopes, setScopes] = useState<string[]>([])
  const [username, setUsername] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState("")

  /*
  useEffect(() => {
    if (data) {
      setScopes(data.scopes)
      setUsername(data.username)
    }
  }, [data])
  */

  const handleSubmit = async (signal: AbortSignal) => {
    if (userId) {
      //const result = await store.dispatch(updateUser({id: userId, username}))
      //onOK(result.payload as UserType)
    } else {
      //const result = await store.dispatch(addUser({username}))
      //onOK(result.payload as UserType)
    }
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }
  const onNameChange = (name: string) => setUsername(name)
  const onPermsChange = (perms: string[]) => setScopes(perms)

  if (!userId) {
    // new form i.e. all forms are empty
    return (
      <GenericModal
        modal_title={modalTitle}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        size={"xl"}
      >
        <UserForm
          initialName={""}
          initialScopes={[]}
          onNameChange={onNameChange}
          onPermsChange={onPermsChange}
        />
        {errorMessage}
      </GenericModal>
    )
  }

  if (status == "loading")
    return (
      <Box pos="relative">
        <GenericModal
          modal_title={modalTitle}
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          size={"xl"}
        >
          <LoadingOverlay
            visible={true}
            zIndex={1000}
            overlayProps={{radius: "sm", blur: 2}}
          />
          <UserForm
            initialName={""}
            initialScopes={[]}
            onNameChange={onNameChange}
            onPermsChange={onPermsChange}
          />
        </GenericModal>
      </Box>
    )

  return (
    <Box pos="relative">
      <GenericModal
        modal_title={modalTitle}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        size={"xl"}
      >
        <UserForm
          initialName={""}
          initialScopes={[]}
          onNameChange={onNameChange}
          onPermsChange={onPermsChange}
        />
      </GenericModal>
    </Box>
  )
}
