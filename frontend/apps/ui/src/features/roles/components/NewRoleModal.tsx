import {useState} from "react"

import {useAddNewRoleMutation} from "@/features/roles/apiSlice"
import {useTranslation} from "react-i18next"
import {RoleFormModal} from "kommon"
import {CheckedNodeStatus} from "@mantine/core"

interface Args {
  opened: boolean
  onSubmit: () => void
  onCancel: () => void
}

export default function NewRoleModalContaner({
  onCancel,
  onSubmit,
  opened
}: Args) {
  const {t} = useTranslation()
  const [addNewRole, {isLoading, isError, isSuccess}] = useAddNewRoleMutation()
  const [name, setName] = useState<string>("")
  const [error, setError] = useState<string>("")
  const [scopes, setScopes] = useState<string[]>([])

  const reset = () => {
    setName("")
    setError("")
    setScopes([])
  }

  const onLocalSubmit = async () => {
    const updatedData = {
      scopes: Object.keys(scopes),
      name: name!
    }
    try {
      await addNewRole(updatedData).unwrap()
    } catch (err: unknown) {
      // @ts-ignore
      setError(err.data.detail)
    }
    reset()
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
    const newPerms = checkedPermissions.map(p => p.value)
    setScopes(newPerms)
    console.log(newPerms)
  }

  return (
    <RoleFormModal
      title={"New Role"}
      inProgress={isLoading}
      opened={opened}
      name={name}
      initialCheckedState={[]}
      onSubmit={onLocalSubmit}
      onCancel={onLocalCancel}
      onPermissionsChange={onPermissionsChange}
      onNameChange={onNameChange}
    />
  )
}
