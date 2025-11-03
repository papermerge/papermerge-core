import {
  CategoryOperator,
  CategoryToken
} from "@/features/search/microcomp/types"
import {Box, Group, MultiSelect, Select, Text} from "@mantine/core"
import styles from "./CatToken.module.css"

interface CategoryTokenPresentationProps {
  item: CategoryToken
  onOperatorChange?: (operator: CategoryOperator) => void
  onValuesChange?: (values: string[]) => void
}

export function CategoryTokenPresentation({
  item,
  onOperatorChange,
  onValuesChange
}: CategoryTokenPresentationProps) {
  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"green"}>cat:</Text>
        <TokenCategoryOperator
          item={item}
          onOperatorChange={onOperatorChange}
        />
        <TokenCategoryValues item={item} onValuesChange={onValuesChange} />
      </Group>
    </Box>
  )
}

interface TokenCategoryOperatorProps {
  item: CategoryToken
  onOperatorChange?: (operator: CategoryOperator) => void
}

function TokenCategoryOperator({
  item,
  onOperatorChange
}: TokenCategoryOperatorProps) {
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

interface TokenCategoryValuesProps {
  item: CategoryToken
  onValuesChange?: (values: string[]) => void
}

function TokenCategoryValues({item, onValuesChange}: TokenCategoryValuesProps) {
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
