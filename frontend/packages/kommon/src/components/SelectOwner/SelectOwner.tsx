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
import type {OwnerSelectorViewProps, Owner, OwnerOption} from "./types"
import type {TFunction} from "i18next"
import {ReactElement} from "react"

export default function OwnerSelectorView({
  value,
  isLoading,
  activeTab,
  userOptions,
  groupOptions,
  currentOptions,
  label,
  combobox,
  onTabChange,
  onSelect,
  onOptionSubmit,
  t
}: OwnerSelectorViewProps) {
  if (isLoading) {
    return (
      <Skeleton height={36}>
        <div />
      </Skeleton>
    )
  }

  const emptyMessage =
    activeTab === "users"
      ? t?.("selectOwner.noUsersFound", {defaultValue: "No users found"})
      : t?.("selectOwner.noGroupsFound", {defaultValue: "No groups found"})

  let comboboxOptions: ReactElement | ReactElement[] = (
    <Combobox.Empty>{emptyMessage}</Combobox.Empty>
  )

  if (currentOptions.length > 0) {
    comboboxOptions = currentOptions.map(item => (
      <Combobox.Option
        value={item.value}
        key={item.value}
        onClick={() => onSelect?.(item.value, item.type)}
      >
        <LabeledIcon item={item} />
      </Combobox.Option>
    ))
  }

  return (
    <Combobox store={combobox} onOptionSubmit={onOptionSubmit}>
      <Combobox.Target>
        <InputBase
          label={label || t?.("selectOwner.label", {defaultValue: "Owner"})}
          component="button"
          type="button"
          pointer
          rightSection={<IconChevronDown size={16} />}
          onClick={() => combobox.toggleDropdown()}
          rightSectionPointerEvents="none"
        >
          <CustomInputBase value={value} t={t} />
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
              {t?.("selectOwner.users") || "Users"} ({userOptions.length})
            </Tabs.Tab>
            <Tabs.Tab value="groups" leftSection={<IconUsers size={14} />}>
              {t?.("selectOwner.groups") || "Groups"}({groupOptions.length})
            </Tabs.Tab>
          </Tabs.List>
        </Tabs>

        <Combobox.Options>{comboboxOptions}</Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

interface Args {
  value: Owner | null
  t?: TFunction
}

function CustomInputBase({value, t}: Args) {
  if (!value) {
    return (
      <Text size="sm" c="dimmed">
        {t?.("selectOwner.selectOwner") || "Select Owner"}
      </Text>
    )
  }

  if (value.type == "user") {
    return (
      <Group gap="xs">
        <Badge
          size="sm"
          leftSection={<IconUser size={12} />}
          variant="light"
          color={"blue"}
        >
          {t?.("selectOwner.user", {defaultValue: "User"})}
        </Badge>
        <Text size="sm">{value.label}</Text>
      </Group>
    )
  }

  return (
    <Group gap="xs">
      <Badge
        size="sm"
        leftSection={<IconUsers size={12} />}
        variant="light"
        color={"green"}
      >
        {t?.("selectOwner.group", {defaultValue: "Group"})}
      </Badge>
      <Text size="sm">{value.label}</Text>
    </Group>
  )
}

function LabeledIcon({item}: {item: OwnerOption}) {
  if (item.type === "user") {
    return (
      <Group gap="xs">
        <IconUser size={16} />
        <Text size="sm">{item.label}</Text>
      </Group>
    )
  }

  return (
    <Group gap="xs">
      <IconUser size={16} />
      <Text size="sm">{item.label}</Text>
    </Group>
  )
}
