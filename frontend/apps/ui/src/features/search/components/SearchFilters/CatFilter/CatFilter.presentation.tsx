import {useGetDocumentTypesQuery} from "@/features/document-types/storage/api"
import type {DocumentTypeDetails} from "@/features/document-types/types"
import {
  CategoryFilter,
  CategoryOperator
} from "@/features/search/microcomp/types"
import {
  ActionIcon,
  Box,
  Group,
  Loader,
  MultiSelect,
  Select,
  Text
} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import styles from "./CatFilter.module.css"

interface Args {
  item: CategoryFilter
  data: ReturnType<typeof useGetDocumentTypesQuery>
  onOperatorChange?: (operator: CategoryOperator) => void
  onValuesChange?: (values: string[]) => void
  onRemove?: () => void
}

export function CategoryFilterPresentation({
  item,
  onOperatorChange,
  onValuesChange,
  onRemove,
  data
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
        <FilterCategoryValues
          item={item}
          data={data}
          onValuesChange={onValuesChange}
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
      onOperatorChange(value as CategoryOperator)
    }
  }

  return (
    <Select
      value={item.operator || "any"}
      w={"8ch"}
      data={["any", "not"]}
      size="sm"
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      className={styles.operatorSelect}
    />
  )
}

interface FilterCategoryValuesArgs {
  item: CategoryFilter
  data: ReturnType<typeof useGetDocumentTypesQuery>
  onValuesChange?: (values: string[]) => void
}

function FilterCategoryValues({
  item,
  onValuesChange,
  data
}: FilterCategoryValuesArgs) {
  const selectData = data?.data?.map((item: DocumentTypeDetails) => ({
    value: item.name,
    label: item.name
  }))
  const handleChange = (values: string[]) => {
    if (onValuesChange) {
      onValuesChange(values)
    }
  }

  const renderSelectData = () => {
    if (data.isLoading) {
      return [
        {
          value: "loading",
          label: "Loading...",
          disabled: true
        }
      ]
    }

    if (data.error) {
      return [
        {
          value: "error",
          label: "Error loading scopes",
          disabled: true
        }
      ]
    }

    if (selectData.length === 0) {
      return [
        {
          value: "empty",
          label: "No scopes found",
          disabled: true
        }
      ]
    }

    return selectData
  }

  return (
    <MultiSelect
      data={renderSelectData()}
      value={item.values || []}
      onChange={handleChange}
      onClick={e => e.stopPropagation()}
      rightSection={data.isLoading ? <Loader size="xs" /> : undefined}
      searchable
      clearable
    />
  )
}
