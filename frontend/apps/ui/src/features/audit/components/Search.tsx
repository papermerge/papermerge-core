import {ActionIcon, Button, Group, Menu, Stack, TextInput} from "@mantine/core"
import {IconAdjustmentsHorizontal, IconSearch} from "@tabler/icons-react"
import OperationFilter from "./OperationFilter2"
import TableNameFilter from "./TableNameFilter2"
import TimestampFilter from "./TimestampFilter2"

export default function Search() {
  return (
    <TextInput
      rightSection={<IconSearch size={16} />}
      leftSectionPointerEvents="auto"
      leftSection={
        <Menu
          shadow="md"
          width={480}
          position="bottom-start"
          closeOnItemClick={false}
          transitionProps={{duration: 0}}
        >
          <Menu.Target>
            <ActionIcon
              variant="subtle"
              color={"blue"}
              size="sm"
              style={{cursor: "pointer"}}
            >
              <IconAdjustmentsHorizontal size={16} />
            </ActionIcon>
          </Menu.Target>

          <Menu.Dropdown>
            <Stack align="stretch" gap="sm" p="sm">
              <TimestampFilter />
              <TableNameFilter />
              <OperationFilter />
            </Stack>

            <Menu.Divider />

            <Group justify="space-between" p="sm">
              <Button variant="subtle" size="xs">
                Clear All
              </Button>
              <Button size="xs" leftSection={<IconSearch size={14} />}>
                Search
              </Button>
            </Group>
          </Menu.Dropdown>
        </Menu>
      }
      placeholder="Search audit logs..."
    />
  )
}
