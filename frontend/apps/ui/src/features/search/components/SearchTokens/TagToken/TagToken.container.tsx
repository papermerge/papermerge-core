import {useAppDispatch, useAppSelector} from "@/app/hooks"
import {TagOperator, TagToken} from "@/features/search/microcomp/types"
import {updateToken} from "@/features/search/storage/search"
import {TagTokenPresentation} from "./TagToken.presentation"
import {useTagTokenLogic} from "./useTagToken"

interface TagTokenContainerProps {
  index: number
}

export function TagTokenContainer({index}: TagTokenContainerProps) {
  const dispatch = useAppDispatch()
  const token = useAppSelector(state => state.search.tokens[index]) as TagToken

  // Redux handlers
  const handleOperatorChange = (operator: TagOperator) => {
    dispatch(updateToken({index, updates: {operator}}))
  }

  const handleValuesChange = (values: string[]) => {
    dispatch(updateToken({index, updates: {values}}))
  }

  // Business logic hook
  const tagLogic = useTagTokenLogic({
    selectedTagNames: token.values || [],
    onValuesChange: handleValuesChange
  })

  return (
    <TagTokenPresentation
      item={token}
      onOperatorChange={handleOperatorChange}
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
