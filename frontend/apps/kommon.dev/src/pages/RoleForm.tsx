import {Group, Stack} from "@mantine/core"
import {RoleForm} from "kommon"

export default function RoleFormContainer() {
  return (
    <Stack>
      <Group>
        <RoleForm readOnly={true} />
      </Group>
    </Stack>
  )
}
