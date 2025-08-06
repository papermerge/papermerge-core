import {Group, Stack, Checkbox, CheckedNodeStatus} from "@mantine/core"
import {RoleForm} from "kommon"
import {useState} from "react"

export default function RoleFormContainer() {
  const [readOnly, setReadOnly] = useState<boolean>(false)

  const onPermissionsChange = (checkedPermissions: CheckedNodeStatus[]) => {
    console.log(checkedPermissions)
  }

  return (
    <Stack>
      <Group>
        <Checkbox label="Read Only" onClick={() => setReadOnly(!readOnly)} />
      </Group>

      <Group>
        <RoleForm
          readOnly={readOnly}
          onPermissionsChange={onPermissionsChange}
        />
      </Group>
    </Stack>
  )
}
