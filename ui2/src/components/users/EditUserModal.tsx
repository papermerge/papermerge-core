import {useState} from "react"
import {useDispatch, useSelector} from "react-redux"

import {useForm} from "@mantine/form"
import {
  MultiSelect,
  Checkbox,
  Group,
  Button,
  Modal,
  TextInput,
  LoadingOverlay
} from "@mantine/core"

import type UseFormReturnType from "@mantine/form"

import {updateUser} from "@/slices/users"
import {UserEditableFields, Group as GroupType} from "@/types"
import {selectUserDetails} from "@/slices/userDetails"

import {RootState} from "@/app/types"
import type {SliceState, SliceStateStatus, UserDetails} from "@/types"
import {selectAllGroups, selectAllGroupsStatus} from "@/slices/groups"

type GenericModalArgs = {
  userId: string
  onOK: (value: UserDetails) => void
  onCancel: (reason?: any) => void
}

export default function EditUserModal({
  userId,
  onOK,
  onCancel
}: GenericModalArgs) {
  const dispatch = useDispatch()
  const {status, data} = useSelector<RootState>(
    selectUserDetails
  ) as SliceState<UserDetails>
  const allGroups = useSelector<RootState>(selectAllGroups) as Array<GroupType>
  const allGroupsStatus = useSelector<RootState>(
    selectAllGroupsStatus
  ) as SliceStateStatus

  const [show, setShow] = useState<boolean>(true)
  const [groups, setGroups] = useState<string[]>(
    data?.groups.map(g => g.name) || []
  )

  const form = useForm<UserEditableFields>({
    mode: "uncontrolled"
  })

  const onSubmit = async (userFields: UserEditableFields) => {
    const group_ids = allGroups
      .filter(g => groups.includes(g.name))
      .map(g => g.id)
    const updatedData = {
      id: userId,
      username: userFields.username,
      email: userFields.email,
      is_active: userFields.is_active,
      is_superuser: userFields.is_superuser,
      group_ids: group_ids
    }

    const response = await dispatch(updateUser(updatedData))
    const userDetailsData = response.payload as UserDetails

    onOK(userDetailsData)
    setShow(false)
  }
  const onClose = () => {
    onCancel()
    setShow(false)
  }

  return (
    <Modal title={"Edit User"} opened={show} onClose={onClose}>
      <LoadingOverlay
        visible={data == null || allGroupsStatus == "loading"}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <form onSubmit={form.onSubmit(onSubmit)}>
        <TextInput
          label="Username"
          placeholder="username"
          defaultValue={data?.username}
          key={form.key("username")}
        />
        <TextInput
          mt="sm"
          label="Email"
          placeholder="email"
          key={form.key("email")}
          defaultValue={data?.email}
        />
        <Checkbox
          mt="sm"
          label="Superuser"
          key={form.key("is_superuser")}
          defaultChecked={data?.is_superuser}
        />
        <Checkbox
          mt="sm"
          label="Active"
          key={form.key("is_active")}
          defaultChecked={data?.is_active}
        />
        <MultiSelect
          label="Groups"
          placeholder="Pick value"
          onChange={setGroups}
          value={groups}
          data={allGroups.map(g => g.name) || []}
        />
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">Submit</Button>
        </Group>
      </form>
    </Modal>
  )
}
