import {TextInput, Checkbox, Stack, MultiSelect} from "@mantine/core"
import CopyButton from "@/components/CopyButton"

import {UserDetails} from "@/types"

type Args = {
  user: UserDetails | null
}

export default function UserForm({user}: Args) {
  return (
    <Stack>
      <TextInput
        label="ID"
        value={user?.id}
        onChange={() => {}}
        rightSection={<CopyButton value={user?.id || ""} />}
      />
      <TextInput
        label="Username"
        value={user?.username || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={user?.username || ""} />}
      />
      <TextInput
        label="Email"
        value={user?.email || ""}
        onChange={() => {}}
        rightSection={<CopyButton value={user?.email || ""} />}
      />
      <Checkbox
        label="Superuser"
        checked={user?.is_superuser}
        onChange={() => {}}
      />
      <Checkbox label="Active" checked={user?.is_active} onChange={() => {}} />
      <MultiSelect
        label="Groups"
        readOnly={true}
        value={user?.groups.map(g => g.name)}
      />
    </Stack>
  )
}
