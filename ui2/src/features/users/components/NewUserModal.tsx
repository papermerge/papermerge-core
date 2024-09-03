import {useState} from "react"

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

import {makeRandomString} from "@/utils"
import {emailValidator, usernameValidator} from "./validators"
import {useGetGroupsQuery} from "@/features/groups/apiSlice"
import {useAddNewUserMutation} from "@/features/users/apiSlice"

interface NewUserModalArgs {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewUserModal({
  onCancel,
  onSubmit,
  opened
}: NewUserModalArgs) {
  const {data = []} = useGetGroupsQuery()
  const [addNewUser, {isLoading, isSuccess}] = useAddNewUserMutation()

  const [groups, setGroups] = useState<string[]>([])

  const form = useForm<UserEditableFields>({
    mode: "uncontrolled",
    validate: {
      username: usernameValidator,
      email: emailValidator
    }
  })

  const onLocalSubmit = async (userFields: UserEditableFields) => {
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

    onSubmit()
    reset()
  }

  const reset = () => {
    form.reset()
    setGroups([])
  }

  const onLocalCancel = () => {
    onCancel()
    reset()
  }

  return (
    <Modal title={"New User"} opened={opened} onClose={onLocalCancel}>
      <LoadingOverlay
        visible={false}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <form onSubmit={form.onSubmit(onLocalSubmit)}>
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
          <Button variant="default" onClick={onLocalCancel}>
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
