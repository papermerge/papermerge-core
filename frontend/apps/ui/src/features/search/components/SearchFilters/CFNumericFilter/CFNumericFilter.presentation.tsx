import {OPERATOR_NUMERIC} from "@/features/search/microcomp/const"
import type {CustomFieldNumericOperator as CustomFieldNumericOperatorType} from "@/features/search/microcomp/types"
import {CustomFieldFilter} from "@/features/search/microcomp/types"
import {ActionIcon, Box, Group, NumberInput, Select, Text} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import styles from "./CFNumericFilter.module.css"

interface Args {
  item: CustomFieldFilter
  onOperatorChange?: (operator: CustomFieldNumericOperatorType) => void
  onValueChange?: (value: string | number) => void
  onRemove?: () => void
}

export function CFNumericFilterPresentation({
  item,
  onOperatorChange,
  onValueChange,
  onRemove
}: Args) {
  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"blue"}>cf:</Text>
        <Text c={"blue"}>{item.fieldName}:</Text>
        <CFNumericOperator item={item} onOperatorChange={onOperatorChange} />
        <NumberInput value={item.value} onChange={onValueChange} w="15ch" />
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

interface FilterTagOperatorArgs {
  item: CustomFieldFilter
  onOperatorChange?: (operator: CustomFieldNumericOperatorType) => void
}

function CFNumericOperator({item, onOperatorChange}: FilterTagOperatorArgs) {
  const handleChange = (value: string | null) => {
    if (value && onOperatorChange) {
      // Remove the trailing colon to get just the operator
      const operator = value.replace(":", "") as CustomFieldNumericOperatorType
      onOperatorChange(operator)
    }
  }

  return (
    <Select
      value={`${item.operator || "="}:`}
      w={"8ch"}
      data={OPERATOR_NUMERIC}
      size="sm"
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      className={styles.operatorSelect}
    />
  )
}
