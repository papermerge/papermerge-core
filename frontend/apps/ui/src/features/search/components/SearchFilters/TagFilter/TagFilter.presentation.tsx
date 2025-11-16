import {TagFilter, TagOperator} from "@/features/search/microcomp/types"
import {ColoredTag} from "@/types"
import {
  ActionIcon,
  Box,
  Combobox,
  Group,
  Pill,
  PillsInput,
  Select,
  Text,
  useCombobox
} from "@mantine/core"
import {IconX} from "@tabler/icons-react"
import styles from "./TagFilter.module.css"

interface TagTokenPresentationProps {
  item: TagFilter
  selectedTags: ColoredTag[]
  availableTags: ColoredTag[]
  onOperatorChange?: (operator: TagOperator) => void
  onRemove?: () => void
  search?: string
  isLoading?: boolean
  combobox?: ReturnType<typeof useCombobox>
  onValueSelect?: (tagName: string) => void
  onValueRemove?: (tagName: string) => void
  onSearchChange?: (value: string) => void
  onBackspace?: () => void
  onToggleDropdown?: () => void
  onOpenDropdown?: () => void
  onCloseDropdown?: () => void
}

export function TagFilterPresentation({
  item,
  selectedTags,
  availableTags,
  onOperatorChange,
  onRemove,
  search = "",
  isLoading = false,
  combobox,
  onValueSelect,
  onValueRemove,
  onSearchChange,

  onBackspace,
  onToggleDropdown,
  onOpenDropdown,
  onCloseDropdown
}: TagTokenPresentationProps) {
  // Fallback combobox for Storybook/testing
  const fallbackCombobox = useCombobox({
    onDropdownClose: () => fallbackCombobox.resetSelectedOption(),
    onDropdownOpen: () => fallbackCombobox.updateSelectedOptionIndex("active")
  })
  const comboboxStore = combobox || fallbackCombobox

  const handleRemoveClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onRemove?.()
  }

  return (
    <Box className={styles.tokenContainer} onClick={e => e.stopPropagation()}>
      <Group gap={0}>
        <Text c={"grape"}>tag:</Text>
        <TokenTagOperator item={item} onOperatorChange={onOperatorChange} />
        <TokenTagValues
          selectedTags={selectedTags}
          availableTags={availableTags}
          search={search}
          isLoading={isLoading}
          combobox={comboboxStore}
          onValueSelect={onValueSelect}
          onValueRemove={onValueRemove}
          onSearchChange={onSearchChange}
          onBackspace={onBackspace}
          onToggleDropdown={onToggleDropdown}
          onOpenDropdown={onOpenDropdown}
          onCloseDropdown={onCloseDropdown}
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

interface TokenTagOperatorProps {
  item: TagFilter
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
  selectedTags: ColoredTag[]
  availableTags: ColoredTag[]
  search?: string
  isLoading?: boolean
  combobox?: ReturnType<typeof useCombobox>
  onValueSelect?: (tagName: string) => void
  onValueRemove?: (tagName: string) => void
  onSearchChange?: (value: string) => void
  onBackspace?: () => void
  onToggleDropdown?: () => void
  onOpenDropdown?: () => void
  onCloseDropdown?: () => void
}

function TokenTagValues({
  selectedTags,
  availableTags,
  search = "",
  isLoading = false,
  combobox,
  onValueSelect,
  onValueRemove,
  onSearchChange,
  onBackspace,
  onToggleDropdown,
  onOpenDropdown,
  onCloseDropdown
}: TokenTagValuesProps) {
  // Fallback combobox for Storybook/testing
  const fallbackCombobox = useCombobox({
    onDropdownClose: () => fallbackCombobox.resetSelectedOption(),
    onDropdownOpen: () => fallbackCombobox.updateSelectedOptionIndex("active")
  })
  const comboboxStore = combobox || fallbackCombobox

  // Render selected tag pills with colors
  const values = selectedTags.map(tag => (
    <Pill
      key={tag.name}
      withRemoveButton
      onRemove={() => onValueRemove?.(tag.name)}
      style={{
        backgroundColor: tag.bg_color,
        color: tag.fg_color
      }}
    >
      {tag.name}
    </Pill>
  ))

  return (
    <Combobox
      store={comboboxStore}
      onOptionSubmit={val => onValueSelect?.(val)}
      withinPortal={true}
    >
      <Combobox.DropdownTarget>
        <PillsInput
          pointer
          onClick={e => {
            e.stopPropagation()
            onToggleDropdown?.()
          }}
          size="sm"
        >
          <Pill.Group>
            {values}
            <Combobox.EventsTarget>
              <PillsInput.Field
                onFocus={() => onOpenDropdown?.()}
                onBlur={() => onCloseDropdown?.()}
                value={search}
                placeholder={
                  selectedTags.length === 0 ? "Select tags" : undefined
                }
                onChange={event => onSearchChange?.(event.currentTarget.value)}
                onClick={e => e.stopPropagation()}
                style={{width: "80px", minWidth: "80px"}}
              />
            </Combobox.EventsTarget>
          </Pill.Group>
        </PillsInput>
      </Combobox.DropdownTarget>

      <Combobox.Dropdown
        onClick={e => e.stopPropagation()}
        style={{
          zIndex: 1000,
          position: "absolute"
        }}
      >
        <Combobox.Options>
          <TagOptionsList
            isLoading={isLoading}
            search={search}
            availableTags={availableTags}
          />
        </Combobox.Options>
      </Combobox.Dropdown>
    </Combobox>
  )
}

interface TagListArgs {
  isLoading: boolean
  search: string
  availableTags: ColoredTag[]
}

function TagOptionsList({isLoading, search, availableTags}: TagListArgs) {
  if (isLoading) {
    return <Combobox.Empty>Loading tags...</Combobox.Empty>
  }

  if (availableTags.length === 0) {
    return (
      <Combobox.Empty>
        {search ? "No tags found" : "All tags selected"}
      </Combobox.Empty>
    )
  }

  return availableTags.map(tag => (
    <Combobox.Option value={tag.name} key={tag.name}>
      <Group gap="sm">
        <Pill
          style={{
            backgroundColor: tag.bg_color,
            color: tag.fg_color
          }}
        >
          {tag.name}
        </Pill>
      </Group>
    </Combobox.Option>
  ))
}
