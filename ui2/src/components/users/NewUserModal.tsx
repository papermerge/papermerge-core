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

import {addUser} from "@/slices/users"
import {UserEditableFields, Group as GroupType} from "@/types"

import {RootState} from "@/app/types"
import type {SliceStateStatus, UserDetails} from "@/types"
import {selectAllGroups, selectAllGroupsStatus} from "@/slices/groups"
import {makeRandomString} from "@/utils"
import {emailValidator, usernameValidator} from "./validators"

type GenericModalArgs = {
  onOK: (value: UserDetails) => void
  onCancel: (reason?: any) => void
}

export default function NewUserModal({onOK, onCancel}: GenericModalArgs) {
  const dispatch = useDispatch()
  const allGroups = useSelector<RootState>(selectAllGroups) as Array<GroupType>
  const allGroupsStatus = useSelector<RootState>(
    selectAllGroupsStatus
  ) as SliceStateStatus

  const [show, setShow] = useState<boolean>(true)
  const [groups, setGroups] = useState<string[]>([])

  const form = useForm<UserEditableFields>({
    mode: "uncontrolled",
    validate: {
      username: usernameValidator,
      email: emailValidator
    }
  })

  const onSubmit = async (userFields: UserEditableFields) => {
    const group_ids = allGroups
      .filter(g => groups.includes(g.name))
      .map(g => g.id)
    const newUserData = {
      username: userFields.username,
      email: userFields.email,
      is_active: userFields.is_active || false,
      is_superuser: userFields.is_superuser || false,
      password: makeRandomString(24),
      scopes: [],
      group_ids: group_ids
    }

    const response = await dispatch(addUser(newUserData))
    const userDetailsData = response.payload as UserDetails

    onOK(userDetailsData)
    setShow(false)
  }
  const onClose = () => {
    onCancel()
    setShow(false)
  }

  return (
    <Modal title={"New User"} opened={show} onClose={onClose}>
      <LoadingOverlay
        visible={allGroupsStatus == "loading"}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <form onSubmit={form.onSubmit(onSubmit)}>
        <TextInput
          label="Username"
          placeholder="username"
          key={form.key("username")}
          {...form.getInputProps("username")}
        />
        <TextInput
          mt="sm"
          label="Email"
          type="email"
          placeholder="email"
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <Checkbox
          mt="sm"
          label="Superuser"
          key={form.key("is_superuser")}
          {...form.getInputProps("is_superuser", {type: "checkbox"})}
        />
        <Checkbox
          mt="sm"
          label="Active"
          key={form.key("is_active")}
          {...form.getInputProps("is_active", {type: "checkbox"})}
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
