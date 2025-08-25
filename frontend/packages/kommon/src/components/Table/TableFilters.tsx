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
  getUniqueValues?: (columnKey: string) => string[]
}

export default function TableFilters<T>({
  columns,
  filters,
  onFiltersChange,
  getUniqueValues
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
    // Customize operators based on column type
    switch (columnKey) {
      case "operation":
        return [
          {value: "equals", label: "Equals"},
          {value: "in", label: "Is one of"}
        ]
      case "timestamp":
        return [
          {value: "range", label: "Date range"},
          {value: "from", label: "From date"},
          {value: "to", label: "Until date"}
        ]
      default:
        return [
          {value: "contains", label: "Contains"},
          {value: "equals", label: "Equals"},
          {value: "startsWith", label: "Starts with"},
          {value: "endsWith", label: "Ends with"}
        ]
    }
  }

  // Get unique values for a column - uses the prop or falls back to default logic
  const getUniqueValuesForColumn = (columnKey: string): string[] => {
    // Use the provided function if available
    if (getUniqueValues) {
      return getUniqueValues(columnKey)
    }

    // Fall back to default/hardcoded values
    switch (columnKey) {
      case "operation":
        return ["INSERT", "UPDATE", "DELETE", "TRUNCATE"]
      case "table_name":
        return ["nodes", "document_versions", "roles", "custom_fields", "users"]
      case "username":
        return ["admin", "user", "system"]
      default:
        return []
    }
  }

  const renderFilterInput = (filter: FilterValue, index: number) => {
    const uniqueValues = getUniqueValuesForColumn(filter.column)

    // For operation column - always use select
    if (filter.column === "operation") {
      return (
        <Select
          placeholder="Select operation"
          data={[
            {value: "INSERT", label: "INSERT"},
            {value: "UPDATE", label: "UPDATE"},
            {value: "DELETE", label: "DELETE"},
            {value: "TRUNCATE", label: "TRUNCATE"}
          ]}
          value={Array.isArray(filter.value) ? filter.value[0] : filter.value}
          onChange={value => updateFilter(index, {value: value || ""})}
          clearable
        />
      )
    }

    // For timestamp column - special handling
    if (filter.column === "timestamp") {
      if (filter.operator === "range") {
        return (
          <Group gap="xs">
            <TextInput
              placeholder="From (YYYY-MM-DD)"
              value={
                typeof filter.value === "string"
                  ? filter.value.split(" - ")[0] || ""
                  : ""
              }
              onChange={event => {
                const from = event.currentTarget.value
                const to =
                  typeof filter.value === "string"
                    ? filter.value.split(" - ")[1] || ""
                    : ""
                updateFilter(index, {
                  value: from && to ? `${from} - ${to}` : from
                })
              }}
              style={{width: 150}}
            />
            <span>to</span>
            <TextInput
              placeholder="To (YYYY-MM-DD)"
              value={
                typeof filter.value === "string"
                  ? filter.value.split(" - ")[1] || ""
                  : ""
              }
              onChange={event => {
                const to = event.currentTarget.value
                const from =
                  typeof filter.value === "string"
                    ? filter.value.split(" - ")[0] || ""
                    : ""
                updateFilter(index, {
                  value: from && to ? `${from} - ${to}` : to
                })
              }}
              style={{width: 150}}
            />
          </Group>
        )
      } else {
        return (
          <TextInput
            placeholder="Date (YYYY-MM-DD)"
            value={
              Array.isArray(filter.value)
                ? filter.value.join(",")
                : filter.value
            }
            onChange={event =>
              updateFilter(index, {value: event.currentTarget.value})
            }
            leftSection={<IconSearch size={16} />}
          />
        )
      }
    }

    // For columns with limited unique values (< 20) - use select
    if (uniqueValues.length > 0 && uniqueValues.length <= 20) {
      const operator = filter.operator || "contains"

      if (operator === "in") {
        // Multi-select for "in" operator
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
      } else {
        // Single select for other operators
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
    }

    // Default text input for everything else
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
