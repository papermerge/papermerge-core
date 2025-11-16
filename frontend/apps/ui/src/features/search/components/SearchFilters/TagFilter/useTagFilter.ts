import {useGetTagsQuery} from "@/features/tags/storage/api"
import {ColoredTag} from "@/types"
import {useCombobox} from "@mantine/core"
import {useMemo, useState} from "react"

interface UseTagTokenLogicProps {
  selectedTagNames: string[]
  onValuesChange?: (values: string[]) => void
}

export function useTagFilterLogic({
  selectedTagNames,
  onValuesChange
}: UseTagTokenLogicProps) {
  const {data: allTags = [], isLoading} = useGetTagsQuery(undefined)
  const combobox = useCombobox({
    onDropdownClose: () => combobox.resetSelectedOption(),
    onDropdownOpen: () => combobox.updateSelectedOptionIndex("active")
  })

  const [search, setSearch] = useState("")

  // Create a map of tag names to full tag objects for easy lookup
  const tagMap = useMemo(() => {
    const map = new Map<string, ColoredTag>()
    allTags.forEach(tag => {
      map.set(tag.name, tag)
    })
    return map
  }, [allTags])

  // Get full tag objects for currently selected values
  const selectedTags = useMemo(() => {
    return selectedTagNames
      .map(name => tagMap.get(name))
      .filter((tag): tag is ColoredTag => tag !== undefined)
  }, [selectedTagNames, tagMap])

  // Filter available tags based on search and exclude already selected ones
  const availableTags = useMemo(() => {
    const selectedNames = new Set(selectedTagNames)
    return allTags.filter(
      tag =>
        !selectedNames.has(tag.name) &&
        tag.name.toLowerCase().includes(search.toLowerCase().trim())
    )
  }, [allTags, selectedTagNames, search])

  const handleValueSelect = (tagName: string) => {
    if (onValuesChange) {
      const newValues = [...selectedTagNames, tagName]
      onValuesChange(newValues)
    }
    setSearch("")
  }

  const handleValueRemove = (tagName: string) => {
    if (onValuesChange) {
      const newValues = selectedTagNames.filter(name => name !== tagName)
      onValuesChange(newValues)
    }
  }

  const handleSearchChange = (value: string) => {
    combobox.updateSelectedOptionIndex()
    setSearch(value)
  }

  const handleBackspace = () => {
    if (search.length === 0 && selectedTags.length > 0) {
      handleValueRemove(selectedTags[selectedTags.length - 1].name)
    }
  }

  const toggleDropdown = () => {
    combobox.toggleDropdown()
  }

  const openDropdown = () => {
    combobox.openDropdown()
  }

  const closeDropdown = () => {
    combobox.closeDropdown()
  }

  return {
    // State
    search,
    isLoading,
    selectedTags,
    availableTags,
    combobox,

    // Handlers
    handleValueSelect,
    handleValueRemove,
    handleSearchChange,
    handleBackspace,
    toggleDropdown,
    openDropdown,
    closeDropdown
  }
}
