import {useEffect, useState} from "react"

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
import {useGetUserQuery, useEditUserMutation} from "@/features/users/apiSlice"

import {useGetGroupsQuery} from "@/features/groups/apiSlice"
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
  const {data, isLoading, isSuccess} = useGetUserQuery(userId)
  const [updateUser, {isLoading: isLoadingUserUpdate}] = useEditUserMutation()

  const [groups, setGroups] = useState<string[]>(
    data?.groups.map(g => g.name) || []
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
        groups: data.groups.map(g => g.name)
      })
    }

    setGroups(data?.groups.map(g => g.name) || [])
  }

  const onLocalSubmit = async (userFields: UserEditableFields) => {
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
