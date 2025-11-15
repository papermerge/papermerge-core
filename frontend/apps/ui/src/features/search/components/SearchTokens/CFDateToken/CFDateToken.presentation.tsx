import {OPERATOR_NUMERIC} from "@/features/search/microcomp/const"
import type {CustomFieldNumericOperator as CustomFieldNumericOperatorType} from "@/features/search/microcomp/types"
import {CustomFieldToken} from "@/features/search/microcomp/types"
import {ActionIcon, Box, Group, Select, Text} from "@mantine/core"
import {DatePickerInput} from "@mantine/dates"
import {IconX} from "@tabler/icons-react"
import {useState} from "react"
import styles from "./CFDateToken.module.css"

interface Args {
  item: CustomFieldToken
  onOperatorChange?: (operator: CustomFieldNumericOperatorType) => void
  onValueChange?: (value: string | number) => void
  onRemove?: () => void
}

export function CFDateTokenPresentation({
  item,
  onOperatorChange,
  onValueChange,
  onRemove
}: Args) {
  const [isOpen, setIsOpen] = useState(false)
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

        <DatePickerInput
          value={new Date(item.value)}
          onClick={e => e.stopPropagation()}
          size="sm"
          w="15ch"
          popoverProps={{
            withinPortal: true,
            zIndex: 1000
          }}
        />
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

interface TokenTagOperatorArgs {
  item: CustomFieldToken
  onOperatorChange?: (operator: CustomFieldNumericOperatorType) => void
}

function CFNumericOperator({item, onOperatorChange}: TokenTagOperatorArgs) {
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
    />
  )
}
