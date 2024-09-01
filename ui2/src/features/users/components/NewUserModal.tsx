import {useState, useEffect} from "react"

import {useForm} from "@mantine/form"
import {
  Loader,
  MultiSelect,
  Checkbox,
  Group,
  Button,
  Modal,
  TextInput,
  LoadingOverlay
} from "@mantine/core"

import {UserEditableFields} from "@/types"

import type {UserDetails} from "@/types"
import {makeRandomString} from "@/utils"
import {emailValidator, usernameValidator} from "./validators"
import {useAddNewUserMutation, useGetGroupsQuery} from "@/features/api/slice"

type GenericModalArgs = {
  onOK: (value: UserDetails) => void
  onCancel: (reason?: any) => void
}

export default function NewUserModal({onCancel}: GenericModalArgs) {
  const {data = []} = useGetGroupsQuery()
  const [addNewUser, {isLoading, isSuccess}] = useAddNewUserMutation()

  const [show, setShow] = useState<boolean>(true)
  const [groups, setGroups] = useState<string[]>([])

  const form = useForm<UserEditableFields>({
    mode: "uncontrolled",
    validate: {
      username: usernameValidator,
      email: emailValidator
    }
  })

  useEffect(() => {
    if (isSuccess) {
      setShow(false)
    }
  }, [isSuccess])

  const onSubmit = async (userFields: UserEditableFields) => {
    const group_ids = data.filter(g => groups.includes(g.name)).map(g => g.id)
    const newUserData = {
      username: userFields.username,
      email: userFields.email,
      is_active: userFields.is_active || false,
      is_superuser: userFields.is_superuser || false,
      password: makeRandomString(24),
      scopes: [],
      group_ids: group_ids
    }
    try {
      await addNewUser(newUserData).unwrap()
    } catch (err) {}
  }
  const onClose = () => {
    onCancel()
    setShow(false)
  }

  return (
    <Modal title={"New User"} opened={show} onClose={onClose}>
      <LoadingOverlay
        visible={false}
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
          data={data.map(g => g.name) || []}
        />
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onClose}>
            Cancel
          </Button>
          <Group>
            {isLoading && <Loader size="sm" />}
            <Button disabled={isLoading || isSuccess} type="submit">
              Submit
            </Button>
          </Group>
        </Group>
      </form>
    </Modal>
  )
}
