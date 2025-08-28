import {ActionIcon, Button, Group, Menu, Stack, TextInput} from "@mantine/core"
import {IconAdjustmentsHorizontal, IconSearch} from "@tabler/icons-react"

interface Args {
  children: React.ReactNode
  onSearch?: () => void
  onClear?: () => void
}

export default function SearchContainer({children, onSearch, onClear}: Args) {
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
              {children}
            </Stack>

            <Menu.Divider />

            <Group justify="space-between" p="sm">
              <Button onClick={onClear} variant="subtle" size="xs">
                Clear All
              </Button>
              <Button
                onClick={onSearch}
                size="xs"
                leftSection={<IconSearch size={14} />}
              >
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
