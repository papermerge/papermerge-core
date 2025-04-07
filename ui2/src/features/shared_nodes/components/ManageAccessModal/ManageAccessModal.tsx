import {useGetSharedNodeAccessDetailsQuery} from "@/features/shared_nodes/apiSlice"
import type {SharedNodeAccessDetails} from "@/types.d/shared_nodes"
import {Button, Container, Group, Loader, Modal, Tabs} from "@mantine/core"
import {IconUsers, IconUsersGroup} from "@tabler/icons-react"
import {useEffect, useState} from "react"
import ManageAccessGroups from "./ManageAccessGroups"
import ManageAccessUsers from "./ManageAccessUsers"
import ManageRole from "./ManageRole"

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

type Args = {
  stack: ModalStackReturnType<"manage-access" | "manage-role">
  node_id: string
  onClose: () => void
}

export const ManageAccessModal = ({node_id, onClose, stack}: Args) => {
  const {data, isLoading} = useGetSharedNodeAccessDetailsQuery(node_id)
  const [selectedUserIDs, setSelectedUserIDs] = useState<string[]>([])
  const [selectedGroupIDs, setSelectedGroupIDs] = useState<string[]>([])
  const [access, setAccess] = useState<SharedNodeAccessDetails>()

  useEffect(() => {
    if (data) {
      setAccess(data)
    }
  }, [data])

  const onUserSelectionChange = (user_id: string, checked: boolean) => {
    if (checked) {
      setSelectedUserIDs([...selectedUserIDs, user_id])
    } else {
      const newSelIDs = selectedUserIDs.filter(id => id != user_id)
      setSelectedUserIDs(newSelIDs)
    }
  }

  const localSubmit = async () => {
    stack.closeAll()
  }

  const localCancel = () => {
    stack.closeAll()
  }

  const onClickViewUserRole = () => {
    stack.open("manage-role")
  }

  const onClickDeleteUserRole = () => {}

  const onClickViewGroupRole = () => {
    stack.open("manage-role")
  }

  const onClickDeleteGroupRole = () => {}

  const onCancelRoleView = () => {
    stack.close("manage-role")
    setSelectedUserIDs([])
  }

  const onSubmitRoleView = () => {
    stack.close("manage-role")
    setSelectedUserIDs([])
  }

  const onRoleChanged = () => {}

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
              <Tabs.Tab value="users" leftSection={<IconUsers size={18} />}>
                Users
              </Tabs.Tab>
              <Tabs.Tab
                value="groups"
                leftSection={<IconUsersGroup size={18} />}
              >
                Groups
              </Tabs.Tab>
            </Tabs.List>
            <Tabs.Panel value="users">
              <ManageAccessUsers
                node_id={node_id}
                onSelectionChange={onUserSelectionChange}
                selectedIDs={selectedUserIDs}
                onClickViewButton={onClickViewUserRole}
                onClickDeleteButton={onClickDeleteUserRole}
              />
            </Tabs.Panel>
            <Tabs.Panel value="groups">
              <ManageAccessGroups
                node_id={node_id}
                onClickViewButton={onClickViewGroupRole}
                onClickDeleteButton={onClickDeleteGroupRole}
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
