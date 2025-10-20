import {
  Combobox,
  InputBase,
  Group,
  Text,
  Badge,
  Skeleton,
  Tabs
} from "@mantine/core"
import {IconUsers, IconUser, IconChevronDown} from "@tabler/icons-react"
import type {OwnerSelectorViewProps} from "./types"

export default function OwnerSelectorView({
  value,
  label,
  isLoading,
  activeTab,
  userOptions,
  groupOptions,
  currentOptions,
  emptyMessage,
  footerText,
  combobox,
  onTabChange,
  onSelect,
  onOptionSubmit
}: OwnerSelectorViewProps) {
  if (isLoading) {
    return (
      <Skeleton height={36} mt="md">
        <div />
      </Skeleton>
    )
  }

  return (
    <div style={{marginTop: "1rem"}}>
      <Combobox store={combobox} onOptionSubmit={onOptionSubmit}>
        <Combobox.Target>
          <InputBase
            label={label}
            component="button"
            type="button"
            pointer
            rightSection={<IconChevronDown size={16} />}
            onClick={() => combobox.toggleDropdown()}
            rightSectionPointerEvents="none"
          >
            {value ? (
              <Group gap="xs">
                <Badge
                  size="sm"
                  leftSection={
                    value.type === "user" ? (
                      <IconUser size={12} />
                    ) : (
                      <IconUsers size={12} />
                    )
                  }
                  variant="light"
                  color={value.type === "user" ? "blue" : "green"}
                >
                  {value.type === "user" ? "User" : "Group"}
                </Badge>
                <Text size="sm">{value.label}</Text>
              </Group>
            ) : (
              <Text size="sm" c="dimmed">
                Select owner
              </Text>
            )}
          </InputBase>
        </Combobox.Target>

        <Combobox.Dropdown>
          <Tabs
            value={activeTab}
            onChange={val => onTabChange?.(val || "users")}
            variant="pills"
          >
            <Tabs.List mb="xs">
              <Tabs.Tab value="users" leftSection={<IconUser size={14} />}>
                Users ({userOptions.length})
              </Tabs.Tab>
              <Tabs.Tab value="groups" leftSection={<IconUsers size={14} />}>
                Groups ({groupOptions.length})
              </Tabs.Tab>
            </Tabs.List>
          </Tabs>

          <Combobox.Options>
            {currentOptions.length > 0 ? (
              currentOptions.map(item => (
                <Combobox.Option
                  value={item.value}
                  key={item.value}
                  onClick={() => onSelect?.(item.value, item.type)}
                >
                  <Group gap="xs">
                    {item.type === "user" ? (
                      <IconUser size={16} />
                    ) : (
                      <IconUsers size={16} />
                    )}
                    <Text size="sm">{item.label}</Text>
                  </Group>
                </Combobox.Option>
              ))
            ) : (
              <Combobox.Empty>{emptyMessage}</Combobox.Empty>
            )}
          </Combobox.Options>

          <Text
            size="xs"
            c="dimmed"
            p="xs"
            pt="sm"
            style={{borderTop: "1px solid var(--mantine-color-gray-3)"}}
          >
            {footerText}
          </Text>
        </Combobox.Dropdown>
      </Combobox>
    </div>
  )
}
