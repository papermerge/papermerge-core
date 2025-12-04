import CopyButton from "@/components/CopyButton"
import {getCustomFieldTypes} from "@/features/custom-fields/utils"
import {
  Badge,
  Box,
  Group,
  NativeSelect,
  Stack,
  Text,
  TextInput
} from "@mantine/core"
import type {CustomFieldFormProps, SelectOption} from "./types"

/**
 * Presentation component for readonly custom field form
 *
 * Displays custom field properties including:
 * - ID, Name, Type, Owner
 * - Currency for monetary fields
 * - Options for select/multiselect fields
 */
export function CustomFieldFormPresentation({
  id,
  name,
  typeHandler,
  config,
  isSelectType,
  t
}: CustomFieldFormProps) {
  return (
    <Box>
      <TextInput
        my="md"
        label={t?.("customFieldColumns.id", {defaultValue: "ID"}) || "ID"}
        value={id}
        readOnly
        rightSection={<CopyButton value={id} />}
      />
      <TextInput
        my="md"
        label={t?.("customFieldColumns.name", {defaultValue: "Name"}) || "Name"}
        value={name}
        readOnly
        rightSection={<CopyButton value={name} />}
      />
      <NativeSelect
        mt="sm"
        label={t?.("customFieldColumns.type", {defaultValue: "Type"}) || "Type"}
        value={typeHandler}
        data={getCustomFieldTypes(t)}
        disabled
      />

      {/* Show currency for monetary fields */}
      {typeHandler === "monetary" && config.currency && (
        <TextInput
          my="md"
          label={
            t?.("customFieldColumns.currency", {defaultValue: "Currency"}) ||
            "Currency"
          }
          value={config.currency}
          readOnly
          rightSection={<CopyButton value={config.currency} />}
        />
      )}

      {/* Show options for select/multiselect fields */}
      {isSelectType && config.options && config.options.length > 0 && (
        <Stack my="md" gap="xs">
          <Text size="sm" fw={500}>
            {t?.("customFieldColumns.options", {defaultValue: "Options"}) ||
              "Options"}
          </Text>
          <SelectOptionsDisplay options={config.options} />
        </Stack>
      )}
    </Box>
  )
}

/**
 * Component to display select options as badges
 */
function SelectOptionsDisplay({options}: {options: SelectOption[]}) {
  return (
    <Group gap="xs" wrap="wrap">
      {options.map((option, index) => (
        <Badge
          key={option.value || index}
          variant="light"
          color={option.color || "blue"}
          style={{textTransform: "none"}}
        >
          {option.label}
          {option.value !== option.label && (
            <Text span size="xs" c="dimmed" ml={4}>
              ({option.value})
            </Text>
          )}
        </Badge>
      ))}
    </Group>
  )
}

export default CustomFieldFormPresentation
