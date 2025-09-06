import {useGetRolesQuery} from "@/features/roles/storage/api"
import {
  useGetSharedNodeAccessDetailsQuery,
  useUpdateSharedNodeAccessMutation
} from "@/features/shared_nodes/store/apiSlice"
import type {
  GroupUpdate,
  SharedNodeAccessDetails,
  SharedNodeAccessUpdate,
  UserUpdate
} from "@/types.d/shared_nodes"
import {Button, Container, Group, Loader, Modal, Tabs} from "@mantine/core"
import {IconUsers, IconUsersGroup} from "@tabler/icons-react"
import {produce} from "immer"
import {useEffect, useState} from "react"
import ManageAccessGroups from "./ManageAccessGroups"
import ManageAccessUsers from "./ManageAccessUsers"
import ManageRole from "./ManageRole"
import type {IDType} from "./type"

interface ModalStackReturnType<T extends string> {
  state: Record<T, boolean>
  open: (id: T) => void
  close: (id: T) => void
  toggle: (id: T) => void
  closeAll: () => void
  register: (id: T) => {
    opened: boolean
    onClose: () => void
    stackId: T
  }
}

type ManagedRole = {
  idType: IDType
  selectedID: string
  roles: string[]
}

type Args = {
  stack: ModalStackReturnType<"manage-access" | "manage-role">
  node_id: string
  onClose: () => void
}

export const ManageAccessModal = ({node_id, onClose, stack}: Args) => {
  const {data: initialData, isLoading} =
    useGetSharedNodeAccessDetailsQuery(node_id)
  const {data: allRoles = []} = useGetRolesQuery()
  const [updateAccess] = useUpdateSharedNodeAccessMutation()
  const [selectedUserIDs, setSelectedUserIDs] = useState<string[]>([])
  const [selectedGroupIDs, setSelectedGroupIDs] = useState<string[]>([])
  const [access, setAccess] = useState<SharedNodeAccessDetails>()
  const [managedRoles, setManagedRoles] = useState<ManagedRole>()

  useEffect(() => {
    if (initialData) {
      setAccess(initialData)
    }
  }, [initialData])

  const onUserSelectionChange = (user_id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIDs([...selectedUserIDs, user_id])
    } else {
      const newSelIDs = selectedUserIDs.filter(id => id != user_id)
      setSelectedUserIDs(newSelIDs)
    }
  }

  const onGroupSelectionChange = (group_id: string, checked: boolean) => {
    if (checked) {
      setSelectedGroupIDs([...selectedUserIDs, group_id])
    } else {
      const newSelIDs = selectedGroupIDs.filter(id => id != group_id)
      setSelectedGroupIDs(newSelIDs)
    }
  }

  const localSubmit = async () => {
    const accessData = getAccessData4BE({access, node_id})
    await updateAccess(accessData)
    stack.closeAll()
    onClose()
  }

  const localCancel = () => {
    stack.closeAll()
    onClose()
  }

  const onClickViewRole = () => {
    stack.open("manage-role")
  }

  const onClickDeleteRole = (selectedIDs: string[], idType: IDType) => {
    if (idType == "user") {
      if (access) {
        const nextDataState = produce(access, draft => {
          const newUsers = draft.users.filter(u => !selectedIDs.includes(u.id))
          draft.users = newUsers
        })
        setAccess(nextDataState)
      }
      setSelectedUserIDs([])
    } else if (idType == "group") {
      if (access) {
        const nextDataState = produce(access, draft => {
          const newGroups = draft.groups.filter(
            g => !selectedIDs.includes(g.id)
          )
          draft.groups = newGroups
        })
        setAccess(nextDataState)
      }
      setSelectedGroupIDs([])
    }
  }

  const onCancelRoleView = () => {
    stack.close("manage-role")
    setSelectedUserIDs([])
    setSelectedGroupIDs([])
  }

  const onSubmitRoleView = () => {
    stack.close("manage-role")
    /* managedRoles.roles is only a list of strings, we need role IDs as well */

    if (managedRoles && access) {
      const newRolesWithIDs = allRoles?.filter(r =>
        managedRoles.roles.includes(r.name)
      )

      if (managedRoles.idType == "group") {
        const changedGroup = access.groups.find(
          g => g.id == managedRoles.selectedID
        )
        if (changedGroup) {
          const nextDataState = produce(access, draft => {
            const oldGroups = draft.groups.filter(g => g.id != changedGroup.id)
            draft.groups = [
              ...oldGroups,
              {
                id: changedGroup.id,
                name: changedGroup.name,
                roles: newRolesWithIDs
              }
            ]
          })
          setAccess(nextDataState)
        }
      } // update for group
      if (managedRoles.idType == "user") {
        const changedUser = access.users.find(
          u => u.id == managedRoles.selectedID
        )
        if (changedUser) {
          const nextDataState = produce(access, draft => {
            const oldUsers = access.users.filter(u => u.id != changedUser.id)
            draft.users = [
              ...oldUsers,
              {
                id: changedUser.id,
                username: changedUser.username,
                roles: newRolesWithIDs
              }
            ]
          })
          setAccess(nextDataState)
        }
      } // update for user
    }
    setSelectedUserIDs([])
    setManagedRoles(undefined)
  }

  const onRoleChanged = (
    selectedID: string,
    idType: IDType,
    value: string[]
  ) => {
    setManagedRoles({
      selectedID,
      idType,
      roles: value
    })
  }

  const onClickTab = () => {
    setSelectedUserIDs([])
    setSelectedGroupIDs([])
  }

  if (isLoading) {
    return (
      <Modal.Stack>
        <Modal
          {...stack.register("manage-access")}
          title="Manage Access"
          size={"lg"}
          onClose={localCancel}
        >
          <Container>
            <Loader />
            <Group gap="lg" justify="space-between">
              <Button variant="default" onClick={localCancel}>
                Cancel
              </Button>
              <Button disabled={true}>Save</Button>
            </Group>
          </Container>
        </Modal>
      </Modal.Stack>
    )
  }

  return (
    <Modal.Stack>
      <Modal
        {...stack.register("manage-access")}
        title="Manage Access"
        size={"lg"}
      >
        <Container>
          <Tabs defaultValue="users">
            <Tabs.List>
              <Tabs.Tab
                value="users"
                onClick={onClickTab}
                leftSection={<IconUsers size={18} />}
              >
                Users
              </Tabs.Tab>
              <Tabs.Tab
                value="groups"
                onClick={onClickTab}
                leftSection={<IconUsersGroup size={18} />}
              >
                Groups
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="users">
              <ManageAccessUsers
                data={access}
                onSelectionChange={onUserSelectionChange}
                selectedIDs={selectedUserIDs}
                onClickViewButton={onClickViewRole}
                onClickDeleteButton={onClickDeleteRole}
              />
            </Tabs.Panel>
            <Tabs.Panel value="groups">
              <ManageAccessGroups
                data={access}
                onSelectionChange={onGroupSelectionChange}
                selectedIDs={selectedGroupIDs}
                onClickViewButton={onClickViewRole}
                onClickDeleteButton={onClickDeleteRole}
              />
            </Tabs.Panel>
          </Tabs>

          <Group gap="lg" justify="space-between">
            <Button variant="default" onClick={localSubmit}>
              Cancel
            </Button>
            <Button
              leftSection={false && <Loader size={"sm"} />}
              onClick={localSubmit}
              disabled={false}
            >
              Save
            </Button>
          </Group>
        </Container>
      </Modal>
      <Modal {...stack.register("manage-role")} title="Manage Role" size={"lg"}>
        <Container>
          <ManageRole
            selectedGroupIDs={selectedGroupIDs}
            selectedUserIDs={selectedUserIDs}
            users={access?.users || []}
            groups={access?.groups || []}
            onChange={onRoleChanged}
          />
          <Group gap="lg" justify="space-between">
            <Button variant="default" onClick={onCancelRoleView}>
              Cancel
            </Button>
            <Button
              leftSection={false && <Loader size={"sm"} />}
              onClick={onSubmitRoleView}
              disabled={false}
            >
              Save
            </Button>
          </Group>
        </Container>
      </Modal>
    </Modal.Stack>
  )
}

interface GetAccessData4BEArgs {
  access?: SharedNodeAccessDetails
  node_id: string
}

function getAccessData4BE({
  access,
  node_id
}: GetAccessData4BEArgs): SharedNodeAccessUpdate {
  let result = {
    id: node_id,
    users: [],
    groups: []
  }

  if (!access) {
    return result
  }

  let users: UserUpdate[] = []
  let groups: GroupUpdate[] = []

  for (let i = 0; i < access.users.length; i++) {
    let user: UserUpdate = {
      id: access.users[i].id,
      role_ids: access.users[i].roles.map(r => r.id)
    }
    users.push(user)
  }

  for (let i = 0; i < access.groups.length; i++) {
    let group: GroupUpdate = {
      id: access.groups[i].id,
      role_ids: access.groups[i].roles.map(r => r.id)
    }
    groups.push(group)
  }

  return {
    id: node_id,
    users: users,
    groups: groups
  }
}
