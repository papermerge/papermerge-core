import {useState} from "react"

import useI18NText from "@/features/roles/hooks/useRoleFormI18NText"
import {useAddNewRoleMutation} from "@/features/roles/storage/api"
import {client2serverPerms} from "@/features/roles/utils"
import {CheckedNodeStatus} from "@mantine/core"
import {RoleFormModal} from "kommon"
import {useTranslation} from "react-i18next"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewRoleModalContainer({
  onCancel,
  onSubmit,
  opened
}: Args) {
  const {t} = useTranslation()
  const [addNewRole, {isLoading}] = useAddNewRoleMutation()
  const [name, setName] = useState<string>("")
  const [scopes, setScopes] = useState<string[]>([])
  const txt = useI18NText()

  const reset = () => {
    setName("")
    setScopes([])
  }

  const onLocalSubmit = async () => {
    const updatedData = {
      scopes: scopes,
      name: name!
    }
    try {
      await addNewRole(updatedData).unwrap()
      onSubmit()
    } catch (err) {}
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
      title={t("roles.new.title")}
      inProgress={isLoading}
      opened={opened}
      name={name}
      txt={txt}
      initialCheckedState={[]}
      onSubmit={onLocalSubmit}
      onCancel={onLocalCancel}
      onPermissionsChange={onPermissionsChange}
      onNameChange={onNameChange}
    />
  )
}
