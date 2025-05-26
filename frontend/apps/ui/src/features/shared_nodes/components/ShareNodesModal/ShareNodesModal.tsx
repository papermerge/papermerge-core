import {useGetGroupsQuery} from "@/features/groups/apiSlice"
import {useGetRolesQuery} from "@/features/roles/apiSlice"
import {useAddNewSharedNodeMutation} from "@/features/shared_nodes/apiSlice"
import {useGetUsersQuery} from "@/features/users/apiSlice"
import {Button, Container, Group, Loader, Modal} from "@mantine/core"
import {useState} from "react"
import SelectGroups from "./SelectGroups"
import SelectRoles from "./SelectRoles"
import SelectUsers from "./SelectUsers"

type Args = {
  opened: boolean
  node_ids: Array<string>
  onSubmit: () => void
  onCancel: () => void
}

export const ShareNodesModal = ({
  node_ids,
  onSubmit,
  onCancel,
  opened
}: Args) => {
  const [users, setUsers] = useState<string[]>([])
  const [roles, setRoles] = useState<string[]>([])
  const [groups, setGroups] = useState<string[]>([])
  const {data: dataUsers} = useGetUsersQuery()
  const {data: dataRoles} = useGetRolesQuery()
  const {data: dataGroups} = useGetGroupsQuery()
  const [addNewSharedNode, {isLoading, isSuccess}] =
    useAddNewSharedNodeMutation()

  const onUsersChange = (newValue: string[]) => {
    setUsers(newValue)
  }
  const onRolesChange = (newValue: string[]) => {
    setRoles(newValue)
  }
  const onGroupsChange = (newValue: string[]) => {
    setGroups(newValue)
  }

  const localSubmit = async () => {
    const group_ids =
      dataGroups?.filter(g => groups?.includes(g.name)).map(g => g.id) || []
    const user_ids =
      dataUsers?.filter(u => users?.includes(u.username)).map(u => u.id) || []
    const role_ids =
      dataRoles?.filter(r => roles?.includes(r.name)).map(r => r.id) || []

    const newSharedNodeData = {
      user_ids,
      group_ids,
      role_ids,
      node_ids
    }
    try {
      await addNewSharedNode(newSharedNodeData).unwrap()
    } catch (err) {}

    onSubmit()
    reset()
  }

  const localCancel = () => {
    // just close the dialog
    onCancel()
  }

  const reset = () => {
    setGroups([])
    setUsers([])
    setRoles([])
  }

  return (
    <Modal
      title="Share Documents and Folders"
      opened={opened}
      onClose={localCancel}
    >
      <Container>
        Pick users and/or groups with whom you want to share
        <SelectUsers onChange={onUsersChange} />
        <SelectGroups onChange={onGroupsChange} />
        <SelectRoles onChange={onRolesChange} />
        <Group gap="lg" justify="space-between">
          <Button variant="default" onClick={localSubmit}>
            Cancel
          </Button>
          <Button
            leftSection={false && <Loader size={"sm"} />}
            onClick={localSubmit}
            disabled={isLoading || isSuccess}
          >
            Share
          </Button>
        </Group>
      </Container>
    </Modal>
  )
}
