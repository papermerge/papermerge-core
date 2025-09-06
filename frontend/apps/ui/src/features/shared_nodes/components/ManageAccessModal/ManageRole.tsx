import {useGetRolesQuery} from "@/features/roles/storage/api"
import type {Group, User} from "@/types.d/shared_nodes"
import {MultiSelect} from "@mantine/core"
import {useEffect, useState} from "react"
import type {IDType} from "./type"

interface Args {
  selectedUserIDs: string[]
  selectedGroupIDs: string[]
  users: User[]
  groups: Group[]
  onChange: (sel_id: string, id_type: IDType, new_roles: string[]) => void
}

export default function ManageRole({
  selectedGroupIDs,
  selectedUserIDs,
  users,
  groups,
  onChange
}: Args) {
  const [roles, setRoles] = useState<string[]>()
  const {data: allRoles = []} = useGetRolesQuery()

  useEffect(() => {
    const roles = getCurrentRoles({
      groupIDs: selectedGroupIDs,
      userIDs: selectedUserIDs,
      users,
      groups
    })
    setRoles(roles)
  }, [selectedGroupIDs, selectedUserIDs])

  const onLocalRoleChange = (value: string[]) => {
    const idType = getIDType({
      groupIDs: selectedGroupIDs,
      userIDs: selectedUserIDs
    })
    setRoles(value)
    if (idType == "user") {
      onChange(selectedUserIDs[0], "user", value)
    } else if (idType == "group") {
      onChange(selectedGroupIDs[0], "group", value)
    }
  }

  return (
    <MultiSelect
      label="Roles"
      placeholder="Pick value"
      onChange={onLocalRoleChange}
      value={roles}
      data={allRoles.map(r => r.name) || []}
    />
  )
}

interface GetCurrentRolesArgs {
  groupIDs: string[]
  userIDs: string[]
  groups: Group[]
  users: User[]
}

function getCurrentRoles({
  groupIDs,
  userIDs,
  users,
  groups
}: GetCurrentRolesArgs): string[] {
  const idType = getIDType({groupIDs, userIDs})

  if (idType == "group") {
    const sel_id = groupIDs[0]
    if (sel_id) {
      const found = groups.find(g => g.id == sel_id)
      if (found) {
        return found.roles.map(r => r.name)
      }
    }
  }
  if (idType == "user") {
    const sel_id = userIDs[0]
    if (sel_id) {
      const found = users.find(u => u.id == sel_id)
      if (found) {
        return found.roles.map(r => r.name)
      }
    }
  }

  return []
}

interface GetIDTypeArgs {
  groupIDs: string[]
  userIDs: string[]
}

function getIDType({groupIDs, userIDs}: GetIDTypeArgs): IDType | undefined {
  if (groupIDs && groupIDs.length == 1) {
    return "group"
  }

  if (userIDs && userIDs.length == 1) {
    return "user"
  }

  console.warn("getIDType returns undefined")
  return undefined
}
