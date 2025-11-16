import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {TagFilter, TagOperator} from "@/features/search/microcomp/types"
import {removeFilter, updateFilter} from "@/features/search/storage/search"
import {TagFilterPresentation} from "./TagFilter.presentation"
import {useTagFilterLogic} from "./useTagFilter"

interface TagFilterContainerProps {
  index: number
}

export function TagFilterContainer({index}: TagFilterContainerProps) {
  const dispatch = useAppDispatch()
  const filter = useAppSelector(
    state => state.search.filters[index]
  ) as TagFilter

  // Redux handlers
  const handleOperatorChange = (operator: TagOperator) => {
    dispatch(updateFilter({index, updates: {operator}}))
  }

  const handleValuesChange = (values: string[]) => {
    dispatch(updateFilter({index, updates: {values}}))
  }

  const handleRemove = () => {
    dispatch(removeFilter(index))
  }

  // Business logic hook
  const tagLogic = useTagFilterLogic({
    selectedTagNames: filter.values || [],
    onValuesChange: handleValuesChange
  })

  return (
    <TagFilterPresentation
      item={filter}
      onOperatorChange={handleOperatorChange}
      onRemove={handleRemove}
      selectedTags={tagLogic.selectedTags}
      availableTags={tagLogic.availableTags}
      search={tagLogic.search}
      isLoading={tagLogic.isLoading}
      combobox={tagLogic.combobox}
      onValueSelect={tagLogic.handleValueSelect}
      onValueRemove={tagLogic.handleValueRemove}
      onSearchChange={tagLogic.handleSearchChange}
      onBackspace={tagLogic.handleBackspace}
      onToggleDropdown={tagLogic.toggleDropdown}
      onOpenDropdown={tagLogic.openDropdown}
      onCloseDropdown={tagLogic.closeDropdown}
    />
  )
}
