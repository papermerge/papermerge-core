// components/TableFilters/TableFilters.tsx
import {
  Button,
  Group,
  MultiSelect,
  Paper,
  Select,
  TextInput
} from "@mantine/core"
import {IconFilter, IconFilterOff, IconSearch} from "@tabler/icons-react"
import {ColumnConfig, FilterValue} from "./types"

interface TableFiltersProps<T> {
  columns: ColumnConfig<T>[]
  filters: FilterValue[]
  onFiltersChange: (filters: FilterValue[]) => void
}

export default function TableFilters<T>({
  columns,
  filters,
  onFiltersChange
}: TableFiltersProps<T>) {
  const filterableColumns = columns.filter(
    col => col.filterable && col.visible !== false
  )

  const addFilter = () => {
    const availableColumns = filterableColumns.filter(
      col => !filters.some(filter => filter.column === String(col.key))
    )

    if (availableColumns.length > 0) {
      const newFilter: FilterValue = {
        column: String(availableColumns[0].key),
        value: "",
        operator: "contains"
      }
      onFiltersChange([...filters, newFilter])
    }
  }

  const updateFilter = (index: number, updates: Partial<FilterValue>) => {
    const newFilters = filters.map((filter, i) =>
      i === index ? {...filter, ...updates} : filter
    )
    onFiltersChange(newFilters)
  }

  const removeFilter = (index: number) => {
    onFiltersChange(filters.filter((_, i) => i !== index))
  }

  const clearAllFilters = () => {
    onFiltersChange([])
  }

  const getOperatorOptions = (columnKey: string) => {
    // You can customize operators based on column type
    return [
      {value: "contains", label: "Contains"},
      {value: "equals", label: "Equals"},
      {value: "startsWith", label: "Starts with"},
      {value: "endsWith", label: "Ends with"}
    ]
  }

  const getUniqueValues = (columnKey: string): string[] => {
    // This would typically come from your data or API
    // For demo purposes, returning some sample values based on column
    switch (columnKey) {
      case "operation":
        return ["INSERT", "UPDATE", "DELETE"]
      case "table_name":
        return ["nodes", "document_versions", "roles", "custom_fields"]
      default:
        return []
    }
  }

  const renderFilterInput = (filter: FilterValue, index: number) => {
    const uniqueValues = getUniqueValues(filter.column)

    if (uniqueValues.length > 0 && uniqueValues.length <= 20) {
      // Use select for columns with limited unique values
      return (
        <Select
          placeholder="Select value"
          data={uniqueValues.map(val => ({value: val, label: val}))}
          value={Array.isArray(filter.value) ? filter.value[0] : filter.value}
          onChange={value => updateFilter(index, {value: value || ""})}
          clearable
          searchable
        />
      )
    }

    if (uniqueValues.length > 20) {
      // Use multi-select for columns with many unique values
      return (
        <MultiSelect
          placeholder="Select values"
          data={uniqueValues.map(val => ({value: val, label: val}))}
          value={Array.isArray(filter.value) ? filter.value : []}
          onChange={values =>
            updateFilter(index, {value: values, operator: "in"})
          }
          searchable
          clearable
        />
      )
    }

    // Default text input
    return (
      <TextInput
        placeholder="Enter value"
        value={
          Array.isArray(filter.value) ? filter.value.join(",") : filter.value
        }
        onChange={event =>
          updateFilter(index, {value: event.currentTarget.value})
        }
        leftSection={<IconSearch size={16} />}
      />
    )
  }

  return (
    <Paper p="md" withBorder>
      <Group justify="space-between" mb="md">
        <Group>
          <IconFilter size={20} />
          <span style={{fontWeight: 500}}>Filters</span>
        </Group>
        <Group>
          {filters.length > 0 && (
            <Button
              variant="subtle"
              size="xs"
              leftSection={<IconFilterOff size={16} />}
              onClick={clearAllFilters}
            >
              Clear all
            </Button>
          )}
          <Button
            size="xs"
            onClick={addFilter}
            disabled={filters.length >= filterableColumns.length}
          >
            Add filter
          </Button>
        </Group>
      </Group>

      {filters.map((filter, index) => (
        <Group key={index} mb="sm" gap="xs">
          <Select
            placeholder="Column"
            data={filterableColumns.map(col => ({
              value: String(col.key),
              label: col.label
            }))}
            value={filter.column}
            onChange={value =>
              updateFilter(index, {column: value || "", value: ""})
            }
            style={{minWidth: 150}}
          />

          <Select
            placeholder="Operator"
            data={getOperatorOptions(filter.column)}
            value={filter.operator || "contains"}
            onChange={value =>
              updateFilter(index, {operator: value as FilterValue["operator"]})
            }
            style={{minWidth: 120}}
          />

          <div style={{flex: 1}}>{renderFilterInput(filter, index)}</div>

          <Button
            variant="subtle"
            color="red"
            size="xs"
            onClick={() => removeFilter(index)}
          >
            Remove
          </Button>
        </Group>
      ))}

      {filters.length === 0 && (
        <div
          style={{
            textAlign: "center",
            padding: "2rem",
            color: "var(--mantine-color-dimmed)"
          }}
        >
          No filters applied. Click "Add filter" to start filtering data.
        </div>
      )}
    </Paper>
  )
}
