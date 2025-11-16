import {
  CategoryFilter,
  CategoryOperator
} from "@/features/search/microcomp/types"
import {ActionIcon, Box, Group, MultiSelect, Select, Text} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import styles from "./CatFilter.module.css"

interface Args {
  item: CategoryFilter
  onOperatorChange?: (operator: CategoryOperator) => void
  onValuesChange?: (values: string[]) => void
  onRemove?: () => void
}

export function CategoryFilterPresentation({
  item,
  onOperatorChange,
  onValuesChange,
  onRemove
}: Args) {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"green"}>cat:</Text>
        <FilterCategoryOperator
          item={item}
          onOperatorChange={onOperatorChange}
        />
        <FilterCategoryValues item={item} onValuesChange={onValuesChange} />
      </Group>
      <ActionIcon
        size="xs"
        className={styles.removeButton}
        onClick={handleRemoveClick}
        aria-label="Remove token"
      >
        <IconX size={10} stroke={3} />
      </ActionIcon>
    </Box>
  )
}

interface FilterCategoryOperatorProps {
  item: CategoryFilter
  onOperatorChange?: (operator: CategoryOperator) => void
}

function FilterCategoryOperator({
  item,
  onOperatorChange
}: FilterCategoryOperatorProps) {
  const handleChange = (value: string | null) => {
    if (value && onOperatorChange) {
      // Remove the trailing colon to get just the operator
      const operator = value.replace(":", "") as CategoryOperator
      onOperatorChange(operator)
    }
  }

  return (
    <Select
      value={`${item.operator || "any"}:`}
      w={"8ch"}
      data={["any:", "not:"]}
      size="sm"
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      className={styles.operatorSelect}
    />
  )
}

interface FilterCategoryValuesProps {
  item: CategoryFilter
  onValuesChange?: (values: string[]) => void
}

function FilterCategoryValues({
  item,
  onValuesChange
}: FilterCategoryValuesProps) {
  const handleChange = (values: string[]) => {
    if (onValuesChange) {
      onValuesChange(values)
    }
  }

  return (
    <MultiSelect
      data={item.values || []}
      value={item.values || []}
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
    />
  )
}
