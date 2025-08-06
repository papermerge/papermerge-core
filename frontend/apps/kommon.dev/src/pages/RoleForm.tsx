import {Group, Stack, Checkbox, CheckedNodeStatus} from "@mantine/core"
import {RoleForm} from "kommon"
import {useState} from "react"

export default function RoleFormContainer() {
  const [readOnly, setReadOnly] = useState<boolean>(false)
  const initialCheckedState = ["folder.view", "user.view"]

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
          initialCheckedState={initialCheckedState}
          readOnly={readOnly}
          onPermissionsChange={onPermissionsChange}
        />
      </Group>
    </Stack>
  )
}
