import {Button, Group, Stack, Checkbox, CheckedNodeStatus} from "@mantine/core"
import {RoleFormModal} from "kommon"
import {useState} from "react"

export default function RoleFormModalContainer() {
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [opened, setOpened] = useState<boolean>(false)
  const initialCheckedState: string[] = []

  const onPermissionsChange = (checkedPermissions: CheckedNodeStatus[]) => {
    console.log(checkedPermissions)
  }

  return (
    <Stack>
      <Group>
        <Button onClick={() => setOpened(true)}>Open</Button>
        <Checkbox label="Loading" onClick={() => setIsLoading(!isLoading)} />
      </Group>

      <Group>
        <RoleFormModal
          opened={opened}
          title={"New Role"}
          initialCheckedState={initialCheckedState}
          inProgress={isLoading}
          onCancel={() => setOpened(false)}
          onSubmit={() => setOpened(false)}
        />
      </Group>
    </Stack>
  )
}
