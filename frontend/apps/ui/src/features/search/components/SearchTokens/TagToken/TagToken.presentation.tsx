import {TagOperator, TagToken} from "@/features/search/microcomp/types"
import {Box, Group, MultiSelect, Select, Text} from "@mantine/core"
import styles from "./TagToken.module.css"

interface TagTokenPresentationProps {
  item: TagToken
  onOperatorChange?: (operator: TagOperator) => void
  onValuesChange?: (values: string[]) => void
}

export function TagTokenPresentation({
  item,
  onOperatorChange,
  onValuesChange
}: TagTokenPresentationProps) {
  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"blue"}>tag:</Text>
        <TokenTagOperator item={item} onOperatorChange={onOperatorChange} />
        <TokenTagValues item={item} onValuesChange={onValuesChange} />
      </Group>
    </Box>
  )
}

interface TokenTagOperatorProps {
  item: TagToken
  onOperatorChange?: (operator: TagOperator) => void
}

function TokenTagOperator({item, onOperatorChange}: TokenTagOperatorProps) {
  const handleChange = (value: string | null) => {
    if (value && onOperatorChange) {
      // Remove the trailing colon to get just the operator
      const operator = value.replace(":", "") as TagOperator
      onOperatorChange(operator)
    }
  }

  return (
    <Select
      value={`${item.operator || "all"}:`}
      w={"8ch"}
      data={["any:", "all:", "not:"]}
      size="sm"
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      className={styles.operatorSelect}
    />
  )
}

interface TokenTagValuesProps {
  item: TagToken
  onValuesChange?: (values: string[]) => void
}

function TokenTagValues({item, onValuesChange}: TokenTagValuesProps) {
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
