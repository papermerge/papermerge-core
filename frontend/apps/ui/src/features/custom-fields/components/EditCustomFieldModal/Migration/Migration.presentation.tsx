import {Group, List, Paper, Text} from "@mantine/core"
import {useTranslation} from "react-i18next"
import type {OptionValuesChangesTotal} from "../types"

interface Args {
  optionValuesChangesTotal: OptionValuesChangesTotal
}

export default function Migration({optionValuesChangesTotal}: Args) {
  const {t} = useTranslation()

  const items = optionValuesChangesTotal.mappings
    .filter(i => i.count > 0)
    .map(i => (
      <List.Item key={`${i.old_value}-${i.new_value}`}>
        <Group gap={4}>
          <Text c="red">"{i.old_value}"</Text>
          <Text>→</Text>
          <Text c="green">"{i.new_value}"</Text>
          <Text c="dimmed">
            ({t("cfSelectMigration.document", {count: i.count})})
          </Text>
        </Group>
      </List.Item>
    ))

  return (
    <Paper withBorder p="md" my="md" radius="sm">
      <Text size="sm" c="dimmed">
        {t("cfSelectMigration.documents_will_be_updated", {
          count: optionValuesChangesTotal.total_count
        })}
      </Text>
      <List size="sm" mt="xs" withPadding>
        {items}
      </List>
    </Paper>
  )
}
