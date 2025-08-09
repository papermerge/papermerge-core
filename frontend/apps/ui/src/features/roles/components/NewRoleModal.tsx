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
    setError("")
    const updatedData = {
      scopes: scopes,
      name: name!
    }
    try {
      await addNewRole(updatedData).unwrap()
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
      title={"New Role"}
      inProgress={isLoading}
      opened={opened}
      error={error}
      name={name}
      initialCheckedState={[]}
      onSubmit={onLocalSubmit}
      onCancel={onLocalCancel}
      onPermissionsChange={onPermissionsChange}
      onNameChange={onNameChange}
    />
  )
}

const SCOPE_TO_SKIP = [
  "folder",
  "document",
  "tag",
  "custom_field",
  "document_type",
  "shared_node",
  "user",
  "role",
  "group",
  "document.page"
]

const FOLDER_DOCUMENT_NODE_MAP: Record<string, string> = {
  "folder.view": "node.view",
  "folder.create": "node.create",
  "folder.update": "node.update",
  "folder.move": "node.move",
  "folder.delete": "node.delete",
  "document.view": "node.view",
  "document.update": "node.update",
  "document.move": "node.move",
  "document.delete": "node.delete"
}

const PAGE_MANAGEMENT_MAP: Record<string, string> = {
  "document.page.extract": "page.extract",
  "document.page.move": "page.move",
  "document.page.rotate": "page.rotate",
  "document.page.reorder": "page.reorder",
  "document.page.delete": "page.delete"
}

function client2serverPerms(scopes: string[]): string[] {
  let result: string[] = []

  scopes.forEach(scope => {
    if (SCOPE_TO_SKIP.includes(scope)) {
      //
    } else {
      if (Object.keys(FOLDER_DOCUMENT_NODE_MAP).includes(scope)) {
        result.push(FOLDER_DOCUMENT_NODE_MAP[scope])
      } else if (Object.keys(PAGE_MANAGEMENT_MAP).includes(scope)) {
        result.push(PAGE_MANAGEMENT_MAP[scope])
      } else {
        result.push(scope)
      }
    }
  })

  result.push("user.me")

  return result
}
