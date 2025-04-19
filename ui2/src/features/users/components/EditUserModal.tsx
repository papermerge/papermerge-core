import {useEffect, useState} from "react"

import {
  Button,
  Checkbox,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  MultiSelect,
  TextInput
} from "@mantine/core"
import {useForm} from "@mantine/form"

import {useEditUserMutation, useGetUserQuery} from "@/features/users/apiSlice"
import {UserEditableFields} from "@/types"

import {useGetGroupsQuery} from "@/features/groups/apiSlice"
import {useGetRolesQuery} from "@/features/roles/apiSlice"
import {useTranslation} from "react-i18next"

interface EditUserModalArgs {
  opened: boolean
  userId: string
  onSubmit: () => void
  onCancel: () => void
}

export default function EditUserModal({
  userId,
  onCancel,
  onSubmit,
  opened
}: EditUserModalArgs) {
  const {t} = useTranslation()
  const {data: allGroups = []} = useGetGroupsQuery()
  const {data: allRoles = []} = useGetRolesQuery()
  const {data, isLoading, isSuccess} = useGetUserQuery(userId)
  const [updateUser, {isLoading: isLoadingUserUpdate}] = useEditUserMutation()

  const [groups, setGroups] = useState<string[]>(
    data?.groups.map(g => g.name) || []
  )
  const [roles, setRoles] = useState<string[]>(
    data?.roles.map(r => r.name) || []
  )

  const form = useForm<UserEditableFields>({
    mode: "uncontrolled"
  })

  useEffect(() => {
    if (isSuccess) {
      resetForm()
    }
  }, [isLoading, data, opened])

  const resetForm = () => {
    if (data) {
      form.setValues({
        username: data.username,
        email: data.email,
        is_active: data.is_active,
        is_superuser: data.is_superuser,
        groups: data.groups.map(g => g.name),
        roles: data.roles.map(r => r.name)
      })
    }

    setGroups(data?.groups.map(g => g.name) || [])
    setRoles(data?.roles.map(r => r.name) || [])
  }

  const onLocalSubmit = async (userFields: UserEditableFields) => {
    const group_ids = allGroups
      .filter(g => groups.includes(g.name))
      .map(g => g.id)

    const role_ids = allRoles.filter(r => roles.includes(r.name)).map(r => r.id)

    const updatedData = {
      id: userId,
      username: userFields.username,
      email: userFields.email,
      is_active: userFields.is_active,
      is_superuser: userFields.is_superuser,
      group_ids: group_ids,
      role_ids: role_ids
    }
    try {
      await updateUser(updatedData).unwrap()
    } catch (err) {}

    onSubmit()
  }
  const onClose = () => {
    onCancel()
  }

  return (
    <Modal title={t("users.edit.title")} opened={opened} onClose={onClose}>
      <LoadingOverlay
        visible={isLoading}
        zIndex={1000}
        overlayProps={{radius: "sm", blur: 2}}
      />
      <form onSubmit={form.onSubmit(onLocalSubmit)}>
        <TextInput
          label={t("users.form.username")}
          placeholder={t("users.form.username")}
          key={form.key("username")}
          {...form.getInputProps("username")}
        />
        <TextInput
          mt="sm"
          label={t("users.form.email")}
          placeholder={t("users.form.email")}
          key={form.key("email")}
          {...form.getInputProps("email")}
        />
        <Checkbox
          mt="sm"
          label={t("users.form.superuser")}
          key={form.key("is_superuser")}
          {...form.getInputProps("is_superuser", {type: "checkbox"})}
        />
        <Checkbox
          mt="sm"
          label={t("users.form.active")}
          key={form.key("is_active")}
          {...form.getInputProps("is_active", {type: "checkbox"})}
        />
        <MultiSelect
          label={t("users.form.groups")}
          placeholder="Pick value"
          onChange={setGroups}
          value={groups}
          data={allGroups.map(g => g.name) || []}
        />
        <MultiSelect
          label={t("users.form.roles")}
          placeholder="Pick value"
          onChange={setRoles}
          value={roles}
          data={allRoles.map(r => r.name) || []}
        />
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onCancel}>
            {t("common.cancel")}
          </Button>
          <Group>
            {isLoadingUserUpdate && <Loader size="sm" />}
            <Button disabled={isLoadingUserUpdate} type="submit">
              {t("common.submit")}
            </Button>
          </Group>
        </Group>
      </form>
    </Modal>
  )
}
