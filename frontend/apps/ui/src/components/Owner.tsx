import {OwnedBy} from "@/types"
import {Group, Text} from "@mantine/core"
import {IconUser, IconUsersGroup} from "@tabler/icons-react"

interface OwnerArgs {
  value: OwnedBy
}

export default function Owner({value}: OwnerArgs) {
  if (value.type == "group") {
    return (
      <Group gap="xs">
        <IconUsersGroup size={18} />
        <Text>{value.name}</Text>
      </Group>
    )
  }
  return (
    <Group gap="xs">
      <IconUser size={18} />
      <Text>{value.name}</Text>
    </Group>
  )
}
