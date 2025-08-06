import {Group, Stack, Checkbox, CheckedNodeStatus} from "@mantine/core"
import {RoleForm} from "kommon"
import {useState} from "react"

export default function RoleFormContainer() {
  const [readOnly, setReadOnly] = useState<boolean>(false)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const initialCheckedState: string[] = []

  const onPermissionsChange = (checkedPermissions: CheckedNodeStatus[]) => {
    console.log(checkedPermissions)
  }

  return (
    <Stack>
      <Group>
        <Checkbox label="Read Only" onClick={() => setReadOnly(!readOnly)} />
        <Checkbox label="Loading" onClick={() => setIsLoading(!isLoading)} />
      </Group>

      <Group>
        <RoleForm
          initialName={"coco"}
          initialCheckedState={initialCheckedState}
          readOnly={readOnly}
          isLoading={isLoading}
          onPermissionsChange={onPermissionsChange}
        />
      </Group>
    </Stack>
  )
}
