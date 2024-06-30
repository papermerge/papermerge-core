import {useState} from "react"

import {useDispatch, useSelector} from "react-redux"
import {Button, Group, Box, LoadingOverlay} from "@mantine/core"
import {
  selectSelectedIds,
  selectGroupsByIds,
  clearSelection,
  addGroup,
  updateGroup
} from "@/slices/groups"
import {clearGroupDetails, selectGroupDetails} from "@/slices/groupDetails"
import {fetchGroupDetails} from "@/slices/groupDetails"
import GenericModal, {openModal} from "@/components/modals/Generic"
import {store} from "@/app/store"

import type {Group as GroupType, SliceState} from "@/types"

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
    dispatch(fetchGroupDetails(groupId))

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
      .then((g: GroupType[]) => {
        dispatch(clearSelection())
      })
      .catch(() => {})
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
  const {status, error, data} = useSelector<RootState>(
    selectGroupDetails
  ) as SliceState<GroupType>
  const [scopes, setScopes] = useState<string[]>([])
  const [name, setName] = useState<string>("")
  const [errorMessage, setErrorMessage] = useState("")

  const handleSubmit = async (signal: AbortSignal) => {
    if (groupId) {
      const result = await store.dispatch(
        updateGroup({id: groupId, name, scopes})
      )
      onOK(result.payload as GroupType)
    } else {
      const result = await store.dispatch(addGroup({name, scopes}))
      onOK(result.payload as GroupType)
    }
  }
  const handleCancel = () => {
    setErrorMessage("")
    onCancel()
  }
  const onNameChange = (name: string) => setName(name)
  const onPermsChange = (perms: string[]) => setScopes(perms)

  if (!groupId) {
    // new form i.e. all forms are empty
    return (
      <GenericModal
        modal_title={modalTitle}
        onSubmit={handleSubmit}
        onCancel={handleCancel}
        size={"xl"}
      >
        <GroupForm
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
          <GroupForm
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
        <GroupForm
          initialName={data?.name || ""}
          initialScopes={data?.scopes || []}
          onNameChange={onNameChange}
          onPermsChange={onPermsChange}
        />
      </GenericModal>
    </Box>
  )
}
