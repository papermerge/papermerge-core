import {ActionIcon, Button, Group, Menu, Stack, TextInput} from "@mantine/core"
import {IconAdjustmentsHorizontal, IconSearch, IconX} from "@tabler/icons-react"
import {TFunction} from "i18next"

interface Args {
  children: React.ReactNode
  onSearch?: () => void
  onClear?: () => void
  searchText?: string
  onClearSearchText?: () => void
  onTextChange?: (e: React.ChangeEvent<HTMLInputElement>) => void
  t?: TFunction
  placeholder?: string
}

export default function SearchContainer({
  children,
  onSearch,
  onClear,
  searchText,
  onTextChange,
  onClearSearchText,
  t,
  placeholder
}: Args) {
  return (
    <TextInput
      value={searchText}
      onChange={onTextChange}
      w={330}
      rightSection={
        searchText ? (
          <ActionIcon
            variant="subtle"
            color="gray"
            size="sm"
            onClick={onClearSearchText}
            style={{cursor: "pointer"}}
            aria-label={
              t?.("tableSearchContainer.clearSearch") || "clear search"
            }
          >
            <IconX size={16} />
          </ActionIcon>
        ) : (
          <IconSearch size={16} />
        )
      }
      leftSectionPointerEvents="auto"
      leftSection={
        <Menu
          shadow="md"
          width={480}
          position="bottom-start"
          closeOnItemClick={false}
          transitionProps={{duration: 0}}
          onClose={onSearch}
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
                {t?.("tableSearchContainer.clearAll") || "Clear All"}
              </Button>
              <Button
                onClick={onSearch}
                size="xs"
                leftSection={<IconSearch size={14} />}
              >
                {t?.("tableSearchContainer.search") || "Search"}
              </Button>
            </Group>
          </Menu.Dropdown>
        </Menu>
      }
      placeholder={placeholder}
    />
  )
}
