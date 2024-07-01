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
      {selectedIds.length == 1 ? <EditButton userId={selectedIds[0]} /> : ""}
      {selectedIds.length >= 1 ? <DeleteButton /> : ""}
    </Group>
  )
}

function NewButton() {
  const onClick = () => {
    openModal<UserType, ModalPropsType>(UserModal, {
      modalTitle: "New User"
    }).then((value: UserType) => {})
  }
  return (
    <Button leftSection={<IconPlus />} onClick={onClick}>
      New
    </Button>
  )
}

function EditButton({userId}: {userId: string}) {
  const dispatch = useDispatch()

  const onClick = () => {
    /*dispatch(fetchUserDetails(userId))

    openModal<GroupType, ModalPropsType>(GroupModal, {
      modalTitle: "Edit Group",
      groupId: groupId
    })
      .then((value: GroupType) => {
        // 1. user clicked "submit"
        // 2. group was created on server side as well in redux store
        // 3. value contains newly created group object
        dispatch(clearSelection())
        dispatch(clearGroupDetails())
      })
      .catch(() => {
        dispatch(clearSelection())
        dispatch(clearGroupDetails())
      })
  }
      */
  }
  return (
    <Button leftSection={<IconEdit />} onClick={onClick} variant={"default"}>
      Edit
    </Button>
  )
}

type RemoveModalPropsType = {
  users: Array<UserType>
}

function DeleteButton() {
  const dispatch = useDispatch()
  const selectedIds = useSelector(selectSelectedIds)
  const users = useSelector<RootState>(state =>
    selectUsersByIds(state, selectedIds)
  ) as Array<UserType>

  /*
  const onClick = () => {
    openModal<UserType[], RemoveModalPropsType>(RemoveGroupModal, {
      users: users
    })
      .then((u: UserType[]) => {
        dispatch(clearSelection())
      })
      .catch(() => dispatch(clearSelection()))
  }
  */
  return (
    <Button onClick={() => {}} leftSection={<IconX />} color="red">
      Delete
    </Button>
  )
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
