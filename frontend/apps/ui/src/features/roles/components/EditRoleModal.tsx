import {useState} from "react"

import {useEditRoleMutation, useGetRoleQuery} from "@/features/roles/apiSlice"

import {useTranslation} from "react-i18next"
import {RoleFormModal} from "kommon"
import {CheckedNodeStatus} from "@mantine/core"
import {client2serverPerms, server2clientPerms} from "@/features/roles/utils"
import useI18NText from "@/features/roles/hooks/useRoleFormI18NText"

interface Args {
  roleID: string
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function EditRoleModalContainer({
  roleID,
  onCancel,
  onSubmit,
  opened
}: Args) {
  const {t} = useTranslation()
  const {data, isLoading} = useGetRoleQuery(roleID)
  const [updateRole, {isLoading: isLoadingRoleUpdate}] = useEditRoleMutation()
  const [name, setName] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [scopes, setScopes] = useState<string[]>([])
  const txt = useI18NText()

  const reset = () => {
    setName("")
    setError("")
    setScopes([])
  }

  const onLocalSubmit = async () => {
    setError("")
    const updatedData = {
      id: roleID,
      scopes: scopes,
      name: name! || data?.name!
    }
    try {
      await updateRole(updatedData).unwrap()
      onSubmit()
    } catch (err: unknown) {
      if (err && typeof err === "object" && "data" in err) {
        const apiError = err as {data: {detail: string}}
        setError(apiError.data.detail)
      } else {
        setError("An unexpected error occurred")
      }
    }
  }

  const onLocalCancel = () => {
    reset()
    onCancel()
  }

  const onNameChange = (value: string) => {
    setName(value)
    console.log(value)
  }

  const onPermissionsChange = (checkedPermissions: CheckedNodeStatus[]) => {
    const newClientPerms = checkedPermissions.map(p => p.value)
    const serverPerms = client2serverPerms(newClientPerms)
    setScopes(serverPerms)
  }

  return (
    <RoleFormModal
      title={t("roles.edit.title")}
      inProgress={isLoading || isLoadingRoleUpdate}
      opened={opened}
      txt={txt}
      error={error}
      name={name || data?.name}
      initialCheckedState={server2clientPerms(data?.scopes || [])}
      onSubmit={onLocalSubmit}
      onCancel={onLocalCancel}
      onPermissionsChange={onPermissionsChange}
      onNameChange={onNameChange}
    />
  )
}
