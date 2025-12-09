import {
  ActionIcon,
  Box,
  Button,
  Group,
  Stack,
  Text,
  TextInput
} from "@mantine/core"
import {IconPlus, IconTrash} from "@tabler/icons-react"
import {useTranslation} from "react-i18next"
import type {SelectOptionsProps} from "./types"

/**
 * Presentation component for editing select/multiselect options
 *
 * Renders a list of label/value pairs with add/remove functionality.
 * Pure presentational - all state management is handled by parent.
 */
export function SelectOptionsPresentation({
  options,
  onAddOption,
  onRemoveOption,
  onOptionLabelChange,
  onOptionValueChange,
  disabled = false
}: SelectOptionsProps) {
  const {t} = useTranslation()

  return (
    <Stack mt="sm" gap="xs">
      <Text size="sm" fw={500}>
        {t("custom_fields.form.options", {defaultValue: "Options"})}
      </Text>

      {/* Column headers */}
      {options.length > 0 && (
        <Group gap="xs" wrap="nowrap">
          <Text size="xs" c="dimmed" style={{flex: 1}}>
            {t("custom_fields.form.option_label", {defaultValue: "Label"})}
          </Text>
          <Text size="xs" c="dimmed" style={{flex: 1}}>
            {t("custom_fields.form.option_value", {defaultValue: "Value"})}
          </Text>
          {/* Spacer for the delete button column */}
          <Box w={28} />
        </Group>
      )}

      {options.map((option, index) => (
        <Group key={index} gap="xs" wrap="nowrap">
          <TextInput
            placeholder={t("custom_fields.form.option_label", {
              defaultValue: "Label"
            })}
            value={option.label}
            onChange={e => onOptionLabelChange(index, e.currentTarget.value)}
            disabled={disabled}
            style={{flex: 1}}
          />
          <TextInput
            placeholder={t("custom_fields.form.option_value", {
              defaultValue: "Value"
            })}
            value={option.value}
            onChange={e => onOptionValueChange(index, e.currentTarget.value)}
            disabled={disabled}
            style={{flex: 1}}
          />
          <ActionIcon
            color="red"
            variant="subtle"
            onClick={() => onRemoveOption(index)}
            disabled={disabled || options.length <= 1}
            title={t("custom_fields.form.remove_option", {
              defaultValue: "Remove option"
            })}
          >
            <IconTrash size={16} />
          </ActionIcon>
        </Group>
      ))}

      <Button
        variant="light"
        size="xs"
        leftSection={<IconPlus size={14} />}
        onClick={onAddOption}
        disabled={disabled}
        style={{alignSelf: "flex-start"}}
      >
        {t("custom_fields.form.add_option", {defaultValue: "Add Option"})}
      </Button>
    </Stack>
  )
}

export default SelectOptionsPresentation
