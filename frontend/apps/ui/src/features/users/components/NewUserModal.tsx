import {useState} from "react"

import {
  Button,
  Checkbox,
  Group,
  Loader,
  LoadingOverlay,
  Modal,
  TextInput
} from "@mantine/core"
import {useForm} from "@mantine/form"

import {UserEditableFields} from "@/types"

import LazyMultiSelect from "@/components/LazyMultiSelect"
import {useGetGroupsQuery} from "@/features/groups/apiSlice"
import {useGetRolesQuery} from "@/features/roles/storage/api"
import {useAddNewUserMutation} from "@/features/users/storage/api"
import {makeRandomString} from "@/utils"
import {useTranslation} from "react-i18next"
import {emailValidator, usernameValidator} from "./validators"

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
  const {t} = useTranslation()
  const [isGroupsDropdownOpen, setIsGroupsDropdownOpen] = useState(false)
  const [isRolesDropdownOpen, setIsRolesDropdownOpen] = useState(false)

  const {
    data: groupsData = [],
    isLoading: isGroupsLoading,
    isError: isGroupsError
  } = useGetGroupsQuery(undefined, {
    skip: !isGroupsDropdownOpen
  })
  const {
    data: rolesData = [],
    isLoading: isRolesLoading,
    isError: isRolesError
  } = useGetRolesQuery(undefined, {
    skip: !isRolesDropdownOpen
  })
  const groupItems =
    groupsData.map(g => {
      return {value: g.id, label: g.name}
    }) || []
  const roleItems =
    rolesData.map(r => {
      return {value: r.id, label: r.name}
    }) || []

  const [addNewUser, {isLoading, isSuccess}] = useAddNewUserMutation()

  const [groups, setGroups] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])

  const form = useForm<UserEditableFields>({
    mode: "uncontrolled",
    validate: {
      username: usernameValidator,
      email: emailValidator
    }
  })

  const onLocalSubmit = async (userFields: UserEditableFields) => {
    const group_ids = groupsData
      .filter(g => groups.includes(g.id))
      .map(g => g.id)
    const role_ids = rolesData.filter(r => roles.includes(r.id)).map(r => r.id)

    const newUserData = {
      username: userFields.username,
      email: userFields.email,
      is_active: userFields.is_active || false,
      is_superuser: userFields.is_superuser || false,
      password: makeRandomString(24),
      scopes: [],
      group_ids: group_ids,
      role_ids: role_ids
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
    setRoles([])
  }

  const onLocalCancel = () => {
    onCancel()
    reset()
  }

  return (
    <Modal title={t("users.new.title")} opened={opened} onClose={onLocalCancel}>
      <LoadingOverlay
        visible={false}
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
          type="email"
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
        <LazyMultiSelect
          label={t("users.form.groups", {defaultValue: "Groups"})}
          isLoading={isGroupsLoading}
          isError={isGroupsError}
          onDropdownOpen={() => setIsGroupsDropdownOpen(true)}
          onChange={(values: string[]) => setGroups(values)}
          selectedItems={groups}
          items={groupItems}
          t={t}
        />
        <LazyMultiSelect
          label={t("users.form.roles", {defaultValue: "Roles"})}
          isLoading={isRolesLoading}
          onDropdownOpen={() => setIsRolesDropdownOpen(true)}
          isError={isRolesError}
          onChange={(values: string[]) => setRoles(values)}
          selectedItems={roles}
          items={roleItems}
          t={t}
        />
        <Group justify="space-between" mt="md">
          <Button variant="default" onClick={onLocalCancel}>
            {t("common.cancel")}
          </Button>
          <Group>
            {isLoading && <Loader size="sm" />}
            <Button disabled={isLoading || isSuccess} type="submit">
              {t("common.submit")}
            </Button>
          </Group>
        </Group>
      </form>
    </Modal>
  )
}
